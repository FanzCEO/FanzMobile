import { useEffect, useState } from 'react';
import { CreditCard, ShieldCheck, Loader2, CheckCircle, Star, Check, X, Crown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { membershipsApi, type Membership, type UserSubscription } from '@/lib/api/memberships';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/lib/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Memberships() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const isComped = Boolean(user?.comped);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setFetching(true);
    try {
      const [plans, subscription] = await Promise.all([
        membershipsApi.getPlans(),
        membershipsApi.getCurrentSubscription(),
      ]);
      setMemberships(plans);
      setCurrentSubscription(subscription);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load membership plans');
    } finally {
      setFetching(false);
    }
  };

  const handleSubscribe = async (membershipId: string) => {
    setLoading(membershipId);
    try {
      const result = await membershipsApi.subscribe(membershipId);

      if (result.checkout_url) {
        // Redirect to external checkout
        window.location.href = result.checkout_url;
      } else {
        // Subscription created directly
        toast.success(result.message || 'Successfully subscribed!');
        await loadData();
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to subscribe';
      toast.error(message);
    } finally {
      setLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      const result = await membershipsApi.cancel();
      toast.success(result.message || 'Subscription cancelled');
      setShowCancelDialog(false);
      await loadData();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to cancel subscription';
      toast.error(message);
    } finally {
      setCancelling(false);
    }
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  const formatPeriod = (period: string) => {
    const periods: Record<string, string> = {
      week: 'week',
      month: 'month',
      year: 'year',
    };
    return periods[period] || period;
  };

  const isCurrentPlan = (membershipId: string) => {
    return currentSubscription?.membership_id === membershipId &&
           currentSubscription?.status === 'active';
  };

  const hasActiveSubscription = currentSubscription?.status === 'active';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
          <Crown className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gradient">Membership Plans</h1>
          <p className="text-muted-foreground">
            Choose the perfect plan to unlock premium features
          </p>
        </div>
      </div>

      {isComped && (
        <Card className="glass-panel p-4 border-green-500/40 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-green-500" />
          <div>
            <p className="font-semibold">Premium Access Granted</p>
            <p className="text-sm text-muted-foreground">Your account has complimentary access to all features.</p>
          </div>
        </Card>
      )}

      {currentSubscription && currentSubscription.status === 'active' && !isComped && (
        <Card className="glass-panel p-4 border-blue-500/40">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-semibold">Active Subscription</p>
                <p className="text-sm text-muted-foreground">
                  {currentSubscription.membership?.name || 'Current Plan'}
                  {currentSubscription.expires_at && (
                    <> • Renews {new Date(currentSubscription.expires_at).toLocaleDateString()}</>
                  )}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCancelDialog(true)}
              className="text-destructive hover:text-destructive"
            >
              Cancel Subscription
            </Button>
          </div>
        </Card>
      )}

      {currentSubscription && currentSubscription.status === 'cancelled' && (
        <Card className="glass-panel p-4 border-yellow-500/40 flex items-center gap-3">
          <X className="h-5 w-5 text-yellow-500" />
          <div>
            <p className="font-semibold">Subscription Cancelled</p>
            <p className="text-sm text-muted-foreground">
              Your subscription will remain active until {currentSubscription.expires_at ? new Date(currentSubscription.expires_at).toLocaleDateString() : 'the end of the billing period'}
            </p>
          </div>
        </Card>
      )}

      {fetching ? (
        <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading plans...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memberships.filter(m => m.is_active).map((membership) => {
            const isCurrent = isCurrentPlan(membership.id);

            return (
              <Card
                key={membership.id}
                className={cn(
                  'glass-panel p-6 space-y-4 relative overflow-hidden flex flex-col',
                  membership.popular && 'border-primary/50 ring-2 ring-primary/20',
                  isCurrent && 'border-blue-500/50 ring-2 ring-blue-500/20'
                )}
              >
                {membership.popular && (
                  <div className="absolute top-0 right-0">
                    <Badge className="rounded-none rounded-bl-lg gradient-primary">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute top-0 left-0">
                    <Badge className="rounded-none rounded-br-lg bg-blue-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Current Plan
                    </Badge>
                  </div>
                )}

                <div className={cn(membership.popular || isCurrent ? 'mt-6' : '')}>
                  <h3 className="text-2xl font-bold">{membership.name}</h3>
                  {membership.description && (
                    <p className="text-sm text-muted-foreground mt-1">{membership.description}</p>
                  )}
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">
                    ${formatPrice(membership.price_cents)}
                  </span>
                  <span className="text-muted-foreground">/{formatPeriod(membership.billing_period)}</span>
                </div>

                <div className="border-t border-border/50 pt-4 flex-1">
                  <p className="text-sm font-semibold mb-3">Features included:</p>
                  <ul className="space-y-2">
                    {(membership.features || []).map((feature, idx) => {
                      const featureText = typeof feature === 'string' ? feature : feature.name;
                      const featureDesc = typeof feature === 'object' ? feature.description : undefined;

                      return (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-foreground">{featureText}</span>
                            {featureDesc && (
                              <p className="text-xs text-muted-foreground mt-0.5">{featureDesc}</p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <Button
                  className={cn(
                    'w-full mt-auto',
                    membership.popular ? 'gradient-primary' : ''
                  )}
                  variant={membership.popular ? 'default' : 'outline'}
                  disabled={loading !== null || isComped || isCurrent}
                  onClick={() => handleSubscribe(membership.id)}
                >
                  {loading === membership.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : isComped ? (
                    'Access Granted'
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : hasActiveSubscription ? (
                    'Switch Plan'
                  ) : (
                    'Subscribe Now'
                  )}
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {memberships.length === 0 && !fetching && (
        <Card className="glass-panel p-12 text-center">
          <p className="text-muted-foreground">No membership plans available at this time.</p>
        </Card>
      )}

      <Card className="glass-panel p-6 space-y-4">
        <h3 className="text-lg font-semibold">Membership Benefits</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <CreditCard className="h-5 w-5" />
              <h4 className="font-semibold">Flexible Billing</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Choose weekly, monthly, or annual billing. Cancel anytime with no penalties.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
              <h4 className="font-semibold">Secure Payments</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              All payments are processed securely with industry-leading encryption.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <Star className="h-5 w-5" />
              <h4 className="font-semibold">Premium Support</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Get priority support and access to exclusive features for members.
            </p>
          </div>
        </div>
      </Card>

      <Card className="glass-panel p-4 space-y-3">
        <h3 className="font-semibold">Frequently Asked Questions</h3>
        <div className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">How does billing work?</p>
            <p>Your subscription renews automatically based on your chosen billing period. You'll receive a reminder before each renewal.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Can I cancel anytime?</p>
            <p>Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your current billing period.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Can I switch plans?</p>
            <p>Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">What payment methods do you accept?</p>
            <p>We accept all major credit cards, PayPal, and other secure payment methods through our payment processor.</p>
          </div>
        </div>
      </Card>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your subscription? You'll continue to have access until the end of your current billing period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={cancelling}
              className="bg-destructive hover:bg-destructive/90"
            >
              {cancelling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Cancelling...
                </>
              ) : (
                'Yes, Cancel'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
