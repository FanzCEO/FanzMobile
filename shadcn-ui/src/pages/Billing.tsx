import { useEffect, useState } from 'react';
import { CreditCard, ShieldCheck, Loader2, CheckCircle, Gauge, Star, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { billingApi, type Plan, type BillingPolicy } from '@/lib/api/billing';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/lib/hooks/useAuth';
import { cn } from '@/lib/utils';

export default function Billing() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
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
    setLoading(planId);
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
      setLoading(null);
    }
  };

  const aiUsageText = policy
    ? `${policy.ai_usage.free_units.toLocaleString()} ${policy.ai_usage.unit} free per period, then $${(policy.ai_usage.overage_cents_per_unit / 100).toFixed(3)} per ${policy.ai_usage.unit}`
    : 'Free AI credits included, then pay-as-you-go for additional usage';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
          <CreditCard className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gradient">Membership Plans</h1>
          <p className="text-muted-foreground">
            Choose the plan that works best for you
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
            <p className="text-sm text-muted-foreground">You already have full access.</p>
          </div>
        </Card>
      )}

      {fetching ? (
        <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading plans...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                'glass-panel p-6 space-y-4 relative overflow-hidden',
                plan.popular && 'border-primary/50 ring-2 ring-primary/20'
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-none rounded-bl-lg gradient-primary">
                    <Star className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                {plan.description && (
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                )}
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">
                  ${((plan.amount_cents || 0) / 100).toFixed(2)}
                </span>
                <span className="text-muted-foreground">/{plan.interval || 'week'}</span>
              </div>

              <ul className="space-y-2 flex-1">
                {(plan.features || []).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={cn(
                  'w-full',
                  plan.popular ? 'gradient-primary' : ''
                )}
                variant={plan.popular ? 'default' : 'outline'}
                disabled={loading !== null || isComped || hasSubscription}
                onClick={() => handleCheckout(plan.id)}
              >
                {loading === plan.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : isComped ? (
                  'Access granted'
                ) : hasSubscription ? (
                  'Already subscribed'
                ) : (
                  'Subscribe'
                )}
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Card className="glass-panel p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI Usage & Credits</h3>
        </div>
        <p className="text-sm text-muted-foreground">{aiUsageText}</p>
        {policy && (
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(policy.fees).map(([type, config]) => (
              <Badge key={type} variant="secondary">
                {type}: {config.percent}% + ${(config.flat_cents / 100).toFixed(2)}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      <Card className="glass-panel p-4 space-y-3">
        <h3 className="font-semibold">Billing FAQ</h3>
        <div className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">How does billing work?</p>
            <p>Your subscription renews automatically. Cancel anytime from settings.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">What payment methods are accepted?</p>
            <p>We accept all major credit cards, PayPal, and cryptocurrency.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Can I upgrade or downgrade?</p>
            <p>Yes, changes take effect at your next billing cycle.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
