import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, ShieldCheck, Loader2, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { billingApi, Plan } from '@/lib/api/billing';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/useAuth';

const PLAN_FEATURES: Record<string, string[]> = {
  Basic: ['PTT/CB channels', 'Basic messaging', 'Community support'],
  Pro: ['Unlimited PTT/CB channels', 'SMS/WhatsApp connectors', 'AI summaries', 'Priority support'],
  Premium: ['Everything in Pro', 'Telegram/email connectors', 'Advanced analytics', 'Dedicated support'],
};

const formatPrice = (cents: number, interval: string): string => {
  const dollars = (cents / 100).toFixed(2);
  const suffix = interval === 'annual' ? '/yr' : interval === 'weekly' ? '/wk' : '/mo';
  return `$${dollars}${suffix}`;
};

export default function Billing() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['billing-plans'],
    queryFn: billingApi.getPlans,
    staleTime: 60_000,
  });

  const isComped = Boolean(user?.comped);
  const hasSubscription = Boolean(user?.active_subscription);

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

      {plansLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const baseName = plan.name.replace(' Annual', '');
            const features = PLAN_FEATURES[baseName] || PLAN_FEATURES['Basic'];
            const isAnnual = plan.interval === 'annual';

            return (
              <Card key={plan.id} className="glass-panel p-6 space-y-3 border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {isAnnual ? 'Save with annual billing' : 'Billed monthly'}
                    </p>
                  </div>
                  <Badge variant="outline">{formatPrice(plan.amount_cents, plan.interval)}</Badge>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {features.map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>
                <Button
                  className="w-full gradient-primary"
                  disabled={loading || isComped || hasSubscription}
                  onClick={() => {
                    setSelectedPlanId(plan.id);
                    handleCheckout(plan.id);
                  }}
                >
                  {loading && selectedPlanId === plan.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {isComped ? 'Access granted' : hasSubscription ? 'Already subscribed' : 'Subscribe'}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
