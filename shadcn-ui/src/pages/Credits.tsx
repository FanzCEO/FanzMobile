import { useQuery } from '@tanstack/react-query';
import { Coins, Zap, Clock, TrendingUp, CreditCard, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api/client';
import { toast } from '@/components/ui/sonner';

interface UsageStats {
  credits_balance: number;
  total_used: number;
  today: {
    credits_used: number;
    requests: number;
  };
  providers: string[];
}

interface CreditPack {
  amount: number;
  price_cents: number;
  credits: number;
  bonus: string;
}

interface PricingData {
  credit_packs: CreditPack[];
  provider_costs: Record<string, { input: number; output: number }>;
  tiers: Record<string, { requests_per_minute: number; requests_per_day: number; tokens_per_day: number }>;
  free_credits: number;
}

export default function Credits() {
  const { data: usage, isLoading: usageLoading, refetch: refetchUsage } = useQuery<UsageStats>({
    queryKey: ['ai-usage'],
    queryFn: async () => {
      const response = await apiClient.get('/api/ai/usage');
      return response.data;
    },
  });

  const { data: pricing } = useQuery<PricingData>({
    queryKey: ['credits-pricing'],
    queryFn: async () => {
      const response = await apiClient.get('/api/credits/pricing');
      return response.data;
    },
  });

  const handlePurchase = async (pack: CreditPack) => {
    try {
      // In production, this would redirect to payment
      await apiClient.post('/api/credits/purchase', {
        amount: pack.amount,
        payment_method: 'demo',
      });
      toast.success(`Added ${pack.credits} credits to your account!`);
      refetchUsage();
    } catch (error) {
      toast.error('Purchase failed. Please try again.');
    }
  };

  const getTierName = (totalPurchased: number) => {
    if (totalPurchased >= 100000) return 'Unlimited';
    if (totalPurchased >= 10000) return 'Pro';
    if (totalPurchased >= 1000) return 'Starter';
    return 'Free';
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Unlimited': return 'text-purple-400 border-purple-400';
      case 'Pro': return 'text-blue-400 border-blue-400';
      case 'Starter': return 'text-green-400 border-green-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  if (usageLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const tier = getTierName(usage?.total_used || 0);
  const tierLimits = pricing?.tiers?.[tier.toLowerCase()] || { requests_per_day: 50, tokens_per_day: 10000 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gradient">AI Credits & Usage</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Manage your AI usage and purchase additional credits
        </p>
      </div>

      {/* Current Balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-panel p-6 col-span-1 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                <Coins className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available Credits</p>
                <p className="text-3xl font-bold">{usage?.credits_balance?.toLocaleString() || 0}</p>
              </div>
            </div>
            <Badge variant="outline" className={getTierColor(tier)}>
              {tier} Tier
            </Badge>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Daily Usage</span>
                <span>{usage?.today?.requests || 0} / {tierLimits.requests_per_day} requests</span>
              </div>
              <Progress
                value={((usage?.today?.requests || 0) / tierLimits.requests_per_day) * 100}
                className="h-2"
              />
            </div>
          </div>
        </Card>

        <Card className="glass-panel p-6">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="h-5 w-5 text-yellow-400" />
            <span className="font-medium">Today's Stats</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Requests</span>
              <span className="font-medium">{usage?.today?.requests || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Credits Used</span>
              <span className="font-medium">{usage?.today?.credits_used || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Used</span>
              <span className="font-medium">{usage?.total_used?.toLocaleString() || 0}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Available Providers */}
      <Card className="glass-panel p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Built-in AI Providers
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          These providers are included free with your account. No API keys needed!
        </p>
        <div className="flex flex-wrap gap-2">
          {(usage?.providers || ['groq', 'openai', 'google', 'huggingface']).map((provider) => (
            <Badge key={provider} variant="outline" className="text-green-400 border-green-400">
              {provider.charAt(0).toUpperCase() + provider.slice(1)} Ready
            </Badge>
          ))}
        </div>
        <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
          <p className="text-sm text-blue-400">
            <strong>Pro tip:</strong> Groq (Llama 3.3) is the fastest and most cost-effective for chat.
            Use OpenAI or Google for complex tasks.
          </p>
        </div>
      </Card>

      {/* Purchase Credits */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Purchase Credits
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {(pricing?.credit_packs || [
            { amount: 100, price_cents: 100, credits: 100, bonus: '0%' },
            { amount: 500, price_cents: 500, credits: 550, bonus: '10%' },
            { amount: 1000, price_cents: 1000, credits: 1200, bonus: '20%' },
            { amount: 2500, price_cents: 2500, credits: 3250, bonus: '30%' },
            { amount: 5000, price_cents: 5000, credits: 7500, bonus: '50%' },
            { amount: 10000, price_cents: 10000, credits: 17500, bonus: '75%' },
          ]).map((pack, idx) => (
            <Card
              key={idx}
              className={`glass-panel p-4 text-center cursor-pointer hover:border-primary transition-colors ${
                idx === 3 ? 'border-primary ring-2 ring-primary/20' : ''
              }`}
              onClick={() => handlePurchase(pack)}
            >
              {idx === 3 && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                  Popular
                </Badge>
              )}
              <p className="text-2xl font-bold">${(pack.price_cents / 100).toFixed(0)}</p>
              <p className="text-lg font-medium text-primary">{pack.credits.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">credits</p>
              {pack.bonus !== '0%' && (
                <Badge variant="outline" className="mt-2 text-green-400 border-green-400">
                  +{pack.bonus} bonus
                </Badge>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Cost Guide */}
      <Card className="glass-panel p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Credit Cost Guide
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(pricing?.provider_costs || {
            groq: { input: 0.05, output: 0.1 },
            huggingface: { input: 0.02, output: 0.05 },
            google: { input: 0.1, output: 0.2 },
            openai: { input: 0.5, output: 1.0 },
          }).map(([provider, costs]) => (
            <div key={provider} className="p-3 rounded-lg bg-white/5">
              <p className="font-medium capitalize mb-2">{provider}</p>
              <p className="text-xs text-muted-foreground">
                {costs.input} cr / 1K input tokens
              </p>
              <p className="text-xs text-muted-foreground">
                {costs.output} cr / 1K output tokens
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          1 credit ≈ $0.001 • Average chat costs 1-5 credits • Complex tasks may use 10-50 credits
        </p>
      </Card>

      {/* Tier Benefits */}
      <Card className="glass-panel p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Rate Limits by Tier
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(pricing?.tiers || {
            free: { requests_per_minute: 10, requests_per_day: 50, tokens_per_day: 10000 },
            starter: { requests_per_minute: 30, requests_per_day: 500, tokens_per_day: 100000 },
            pro: { requests_per_minute: 60, requests_per_day: 2000, tokens_per_day: 500000 },
            unlimited: { requests_per_minute: 120, requests_per_day: 10000, tokens_per_day: 2000000 },
          }).map(([tierName, limits]) => (
            <div
              key={tierName}
              className={`p-4 rounded-lg ${tierName === tier.toLowerCase() ? 'bg-primary/20 border border-primary' : 'bg-white/5'}`}
            >
              <p className="font-medium capitalize mb-2">{tierName}</p>
              <p className="text-xs text-muted-foreground">{limits.requests_per_minute} req/min</p>
              <p className="text-xs text-muted-foreground">{limits.requests_per_day.toLocaleString()} req/day</p>
              <p className="text-xs text-muted-foreground">{(limits.tokens_per_day / 1000).toFixed(0)}K tokens/day</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
