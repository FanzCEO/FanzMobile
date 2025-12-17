import { useEffect, useState } from 'react';
import { CreditCard, ShieldCheck, Loader2, CheckCircle, Gauge } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { billingApi, type Plan, type BillingPolicy } from '@/lib/api/billing';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/lib/hooks/useAuth';

export default function Billing() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [policy, setPolicy] = useState<BillingPolicy | null>(null);

  const isComped = Boolean(user?.comped);
  const hasSubscription = Boolean(user?.active_subscription);

  useEffect(() => {
    const load = async () => {
      setFetching(true);
      try {
        const [planData, policyData] = await Promise.all([
          billingApi.getPlans(),
          billingApi.getPolicy(),
        ]);
        setPlans(planData);
        setPolicy(policyData);
      } catch (error) {
        console.error(error);
        toast.error('Billing service unavailable');
      } finally {
        setFetching(false);
      }
    };
    load();
  }, []);

  const handleCheckout = async (planId: string) => {
    setLoading(true);
    try {
      const session = await billingApi.createCheckoutSession(planId);
      if (session.checkout_url) {
        window.location.href = session.checkout_url;
      } else {
        toast.error('Checkout URL missing');
      }
    } catch (error) {
      toast.error('Unable to start checkout');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amountCents: number, interval: string) => {
    const dollars = (amountCents / 100).toFixed(2);
    return `$${dollars}/${interval}`;
  };

  const aiUsageText = policy
    ? `${policy.ai_usage.free_units.toLocaleString()} ${policy.ai_usage.unit} free, then $${(policy.ai_usage.overage_cents_per_unit / 100).toFixed(2)} per ${policy.ai_usage.unit}`
    : 'Small free allowance, then overage billed to consumer';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
          <CreditCard className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gradient">Billing & Access</h1>
          <p className="text-muted-foreground">
            Subscription-based access. End users pay; creators stay fee-free.
          </p>
        </div>
      </div>

      {isComped && (
        <Card className="glass-panel p-4 border-green-500/40 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-green-500" />
          <div>
            <p className="font-semibold">Access granted by admin</p>
            <p className="text-sm text-muted-foreground">No billing required for this account.</p>
          </div>
        </Card>
      )}

      {hasSubscription && !isComped && (
        <Card className="glass-panel p-4 border-blue-500/40 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-blue-500" />
          <div>
            <p className="font-semibold">Subscription active</p>
            <p className="text-sm text-muted-foreground">You already have access.</p>
          </div>
        </Card>
      )}

      {fetching ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading billing plans…</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <Card key={plan.id} className="glass-panel p-6 space-y-3 border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Membership billed to end consumer
                  </p>
                </div>
                <Badge variant="outline">{formatPrice(plan.amount_cents, plan.interval)}</Badge>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Weekly access starting at $5.99 (consumer billed)</li>
                <li>• PTT/comms, workflows, and AI tools</li>
                <li>• Platform fees charged to consumer, creators stay fee-free</li>
                <li>• AI usage over free allowance billed as overage</li>
              </ul>
              <Button
                className="w-full gradient-primary"
                disabled={loading || isComped || hasSubscription}
                onClick={() => handleCheckout(plan.id)}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {isComped ? 'Access granted' : hasSubscription ? 'Already subscribed' : 'Subscribe'}
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Card className="glass-panel p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI usage & fees</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {aiUsageText}
        </p>
        {policy && (
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {Object.entries(policy.fees).map(([type, config]) => (
              <Badge key={type} variant="secondary">
                {type}: {config.percent}% + ${(config.flat_cents / 100).toFixed(2)}
              </Badge>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
