/**
 * AI Assistant Page
 * Central hub for all AI features in WickedCRM
 * Ported from Fanz ecosystem with multi-provider support
 */

import { useState, useEffect } from 'react';
import { Bot, MessageSquare, Sparkles, Zap, Heart, TrendingUp, Shield, Brain, BarChart3 } from 'lucide-react';
import { AIChat } from '@/components/ai/AIChat';
import { AIMessageDraft } from '@/components/ai/AIMessageDraft';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface AIHealthStatus {
  status: string;
  api_key_configured: boolean;
  models_available: number;
  total_models: number;
  providers: {
    groq: { available: boolean; model: string };
    openai: { available: boolean; model: string };
    google: { available: boolean; model: string };
    huggingface: { available: boolean; models: string[] };
    ollama: { status: string; models: string[] };
  };
}

type TabId = 'chat' | 'draft' | 'suggestions' | 'analytics' | 'moderation';

interface EngagementPredictionResult {
  predicted_views?: number;
  predicted_likes?: number;
  viral_potential?: number;
  best_posting_time?: string;
  optimization_tips?: string[];
}

interface ModerationResult {
  approved: boolean;
  confidence?: number;
  explanation?: string;
  flags?: string[];
  requires_human_review?: boolean;
}

export default function AIAssistant() {
  const [activeTab, setActiveTab] = useState<'chat' | 'draft' | 'suggestions' | 'analytics' | 'moderation'>('chat');
  const [health, setHealth] = useState<AIHealthStatus | null>(null);
  const [activeCompanion, setActiveCompanion] = useState<string>('flirty');
  const [selectedModel, setSelectedModel] = useState<string>('groq-llama-70b');

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/ai/health');
      const data = await response.json();
      setHealth(data);
    } catch (error) {
      console.error('Failed to fetch AI health:', error);
    }
  };

  const tabs = [
    { id: 'chat', label: 'AI Companion', icon: Bot, description: 'Chat with AI companions' },
    { id: 'draft', label: 'Message Drafts', icon: MessageSquare, description: 'Generate message drafts' },
    { id: 'suggestions', label: 'Content Ideas', icon: Sparkles, description: 'Get content suggestions' },
    { id: 'analytics', label: 'AI Analytics', icon: TrendingUp, description: 'Predict engagement & insights' },
    { id: 'moderation', label: 'Content Check', icon: Shield, description: 'AI content moderation' },
  ];

  const modelOptions = [
    { id: 'groq-llama-70b', label: 'Llama 3.3 70B', detail: 'Fastest, best default (Groq)', provider: 'groq' },
    { id: 'openai-gpt4', label: 'GPT-4o Mini', detail: 'OpenAI reasoning', provider: 'openai' },
    { id: 'dark-planet-10.7b', label: 'Dark Planet 10.7B', detail: 'Creative/adult content (HF)', provider: 'huggingface' },
    { id: 'stheno-v3.2', label: 'Stheno v3.2', detail: 'Roleplay specialist (HF)', provider: 'huggingface' },
    { id: 'dolphin-creative', label: 'Dolphin (Local)', detail: 'Uncensored local model', provider: 'ollama' },
    { id: 'google-gemini', label: 'Gemini Flash', detail: 'Google multimodal', provider: 'google' },
  ];

  const companionPrompts: Record<string, string[]> = {
    flirty: ['Send a flirty opener', 'Plan a playful date idea', 'Turn this into a tease'],
    playful: ['Write a bubbly greeting', 'Suggest a fun voice note', 'Turn this into a cute reply'],
    mysterious: ['Make this mysterious', 'Write a curious hook', 'Turn this into a slow-burn tease'],
    professional: ['Summarize the chat', 'Draft a concise follow-up', 'Bullet the key points'],
  };

  const getProviderStatus = (provider: string) => {
    if (!health || !health.providers) return false;
    const providers = health.providers;
    switch (provider) {
      case 'groq': return providers.groq?.available ?? false;
      case 'openai': return providers.openai?.available ?? false;
      case 'google': return providers.google?.available ?? false;
      case 'huggingface': return providers.huggingface?.available ?? false;
      case 'ollama': return providers.ollama?.status === 'operational';
      default: return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gradient">AI Assistant</h1>
          <p className="text-muted-foreground mt-1">
            Multi-provider AI with {health?.total_models || 14} models across 5 providers
          </p>
        </div>

        {/* Status Badge */}
        {health && (
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm",
            health.api_key_configured
              ? "bg-green-500/20 text-green-400"
              : "bg-yellow-500/20 text-yellow-400"
          )}>
            <div className={cn(
              "w-2 h-2 rounded-full",
              health.api_key_configured ? "bg-green-400" : "bg-yellow-400 animate-pulse"
            )} />
            {health.api_key_configured ? 'AI Fully Active' : 'Demo Mode'}
            <span className="text-muted-foreground">• {health.models_available} providers</span>
          </div>
        )}
      </div>

      {/* Model Selector with Provider Status */}
      <Card className="glass-panel p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-muted-foreground">Model Selection</p>
            <h3 className="text-lg font-semibold">Pick an AI Model</h3>
          </div>
          <div className="flex gap-2 text-xs">
            {['groq', 'openai', 'google', 'huggingface', 'ollama'].map(p => (
              <span key={p} className={cn(
                "px-2 py-1 rounded-full capitalize",
                getProviderStatus(p) ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
              )}>
                {p}
              </span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {modelOptions.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedModel(item.id)}
              disabled={!getProviderStatus(item.provider)}
              className={cn(
                'text-left p-3 rounded-lg border transition-all',
                selectedModel === item.id
                  ? 'border-primary bg-primary/10 shadow-[0_0_0_1px_rgba(59,130,246,0.4)]'
                  : 'border-white/10 hover:border-white/20',
                !getProviderStatus(item.provider) && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="font-medium text-sm">{item.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{item.detail}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Feature Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabId)}
            className={cn(
              "p-3 rounded-xl border text-left transition-all",
              activeTab === tab.id
                ? "bg-primary/20 border-primary"
                : "bg-card/50 border-white/10 hover:border-white/20"
            )}
          >
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                activeTab === tab.id ? "gradient-primary" : "bg-white/10"
              )}>
                <tab.icon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{tab.label}</h3>
                <p className="text-xs text-muted-foreground hidden md:block">{tab.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Panel */}
        <div className="lg:col-span-2">
          {activeTab === 'chat' && (
            <div className="h-[600px]">
              <AIChat
                userId="user1"
                companionId={activeCompanion}
                onCompanionChange={setActiveCompanion}
                model={selectedModel}
                presetPrompts={companionPrompts[activeCompanion] || []}
              />
            </div>
          )}

          {activeTab === 'draft' && (
            <AIMessageDraft
              contactName="Your Contact"
              context="Previous conversation context here"
              onSelect={(msg) => {
                navigator.clipboard.writeText(msg);
              }}
            />
          )}

          {activeTab === 'suggestions' && (
            <ContentSuggestions />
          )}

          {activeTab === 'analytics' && (
            <EngagementPrediction />
          )}

          {activeTab === 'moderation' && (
            <ContentModeration />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="bg-card/50 rounded-xl border border-white/10 p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('chat')}>
                <Bot className="w-4 h-4 mr-2" />
                Start AI Chat
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('analytics')}>
                <TrendingUp className="w-4 h-4 mr-2" />
                Predict Engagement
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('moderation')}>
                <Shield className="w-4 h-4 mr-2" />
                Check Content
              </Button>
            </div>
          </div>

          {/* Companion Personalities */}
          <div className="bg-card/50 rounded-xl border border-white/10 p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-500" />
              AI Personalities
            </h3>
            <div className="space-y-3">
              <PersonalityCard
                id="flirty"
                name="Raven"
                tone="Flirty"
                description="Playful, confident, seductive"
                gradient="from-pink-500 to-purple-500"
                active={activeCompanion === 'flirty'}
                onSelect={() => {
                  setActiveCompanion('flirty');
                  setActiveTab('chat');
                }}
              />
              <PersonalityCard
                id="playful"
                name="Luna"
                tone="Playful"
                description="Bubbly, fun, affectionate"
                gradient="from-cyan-500 to-blue-500"
                active={activeCompanion === 'playful'}
                onSelect={() => {
                  setActiveCompanion('playful');
                  setActiveTab('chat');
                }}
              />
              <PersonalityCard
                id="mysterious"
                name="Shadow"
                tone="Mysterious"
                description="Enigmatic, intriguing, alluring"
                gradient="from-purple-500 to-indigo-500"
                active={activeCompanion === 'mysterious'}
                onSelect={() => {
                  setActiveCompanion('mysterious');
                  setActiveTab('chat');
                }}
              />
              <PersonalityCard
                id="professional"
                name="Morgan"
                tone="Professional"
                description="Helpful, efficient, knowledgeable"
                gradient="from-green-500 to-teal-500"
                active={activeCompanion === 'professional'}
                onSelect={() => {
                  setActiveCompanion('professional');
                  setActiveTab('chat');
                }}
              />
            </div>
          </div>

          {/* Provider Info */}
          <div className="bg-card/50 rounded-xl border border-white/10 p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-500" />
              Available Models
            </h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Groq (Fast)</span>
                <span>Llama 3.3 70B</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">OpenAI</span>
                <span>GPT-4o, GPT-4o Mini</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Google</span>
                <span>Gemini 1.5 Flash/Pro</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">HuggingFace</span>
                <span>6 creative models</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ollama (Local)</span>
                <span>Dolphin Creative</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonalityCard({ id, name, tone, description, gradient, active, onSelect }: {
  id: string;
  name: string;
  tone: string;
  description: string;
  gradient: string;
  active?: boolean;
  onSelect?: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect?.(id)}
      className={cn(
        "w-full flex items-center gap-3 p-2 rounded-lg transition-colors border",
        active ? "border-primary bg-primary/10" : "border-transparent hover:bg-white/5"
      )}
      type="button"
    >
      <div className={cn("w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center", gradient)}>
        <span className="text-sm font-bold text-white">{name[0]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{name}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
      <span className="text-xs bg-white/10 px-2 py-1 rounded">{tone}</span>
    </button>
  );
}

function ContentSuggestions() {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [contentType, setContentType] = useState('post');

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/content-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creator_profile: 'Adult content creator focused on connecting with fans',
          content_type: contentType,
          count: 5
        })
      });
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card/50 rounded-xl border border-white/10 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Content Suggestions</h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {['post', 'story', 'caption', 'bio', 'message'].map(type => (
          <button
            key={type}
            onClick={() => setContentType(type)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm capitalize transition-all",
              contentType === type
                ? "bg-primary text-white"
                : "bg-white/5 hover:bg-white/10"
            )}
          >
            {type}
          </button>
        ))}
      </div>

      <Button onClick={generateSuggestions} disabled={loading} className="w-full gradient-primary">
        {loading ? 'Generating...' : `Generate ${contentType} Ideas`}
      </Button>

      {suggestions.length > 0 && (
        <div className="space-y-3">
          {suggestions.map((suggestion, i) => (
            <div key={i} className="p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-sm">{suggestion}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => navigator.clipboard.writeText(suggestion)}
              >
                Copy
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EngagementPrediction() {
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState('general');
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<EngagementPredictionResult | null>(null);

  const predict = async () => {
    if (!content) return;
    setLoading(true);
    try {
      const response = await fetch('/api/ai/predict-engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_description: content,
          target_audience: audience
        })
      });
      const data = await response.json();
      setPrediction(data);
    } catch (error) {
      console.error('Failed to predict:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card/50 rounded-xl border border-white/10 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Engagement Prediction</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Describe your content and get AI-powered engagement predictions
      </p>

      <Textarea
        placeholder="Describe your content... (e.g., 'A behind-the-scenes photo showing my creative process')"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[100px]"
      />

      <div className="flex flex-wrap gap-2">
        {['general', 'adult', 'subscribers', 'new-followers'].map(aud => (
          <button
            key={aud}
            onClick={() => setAudience(aud)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm capitalize transition-all",
              audience === aud ? "bg-primary text-white" : "bg-white/5 hover:bg-white/10"
            )}
          >
            {aud.replace('-', ' ')}
          </button>
        ))}
      </div>

      <Button onClick={predict} disabled={loading || !content} className="w-full gradient-primary">
        {loading ? 'Analyzing...' : 'Predict Engagement'}
      </Button>

      {prediction && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-white/5 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-400">{prediction.predicted_views?.toLocaleString() || '1,000'}</div>
            <div className="text-xs text-muted-foreground">Predicted Views</div>
          </div>
          <div className="bg-white/5 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-pink-400">{prediction.predicted_likes?.toLocaleString() || '100'}</div>
            <div className="text-xs text-muted-foreground">Predicted Likes</div>
          </div>
          <div className="bg-white/5 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-400">{prediction.viral_potential || 50}%</div>
            <div className="text-xs text-muted-foreground">Viral Potential</div>
          </div>
          <div className="bg-white/5 p-4 rounded-lg text-center">
            <div className="text-lg font-bold text-purple-400">{prediction.best_posting_time || '6:00 PM'}</div>
            <div className="text-xs text-muted-foreground">Best Time</div>
          </div>
        </div>
      )}

      {prediction?.optimization_tips && (
        <div className="bg-white/5 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Optimization Tips
          </h4>
          <ul className="space-y-1">
            {prediction.optimization_tips.map((tip: string, i: number) => (
              <li key={i} className="text-sm text-muted-foreground">• {tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ContentModeration() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ModerationResult | null>(null);

  const moderate = async () => {
    if (!content) return;
    setLoading(true);
    try {
      const response = await fetch('/api/ai/moderate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content,
          content_type: 'text'
        })
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Failed to moderate:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card/50 rounded-xl border border-white/10 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Content Moderation</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Check your content for policy compliance before posting
      </p>

      <Textarea
        placeholder="Paste your content here to check for compliance..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[150px]"
      />

      <Button onClick={moderate} disabled={loading || !content} className="w-full gradient-primary">
        {loading ? 'Analyzing...' : 'Check Content'}
      </Button>

      {result && (
        <div className={cn(
          "p-4 rounded-lg border",
          result.approved ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"
        )}>
          <div className="flex items-center gap-2 mb-2">
            <div className={cn(
              "w-3 h-3 rounded-full",
              result.approved ? "bg-green-500" : "bg-red-500"
            )} />
            <span className="font-semibold">
              {result.approved ? 'Content Approved' : 'Review Required'}
            </span>
            <span className="text-sm text-muted-foreground ml-auto">
              {Math.round((result.confidence || 0.7) * 100)}% confidence
            </span>
          </div>

          {result.explanation && (
            <p className="text-sm text-muted-foreground mb-2">{result.explanation}</p>
          )}

          {result.flags && result.flags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {result.flags.map((flag: string, i: number) => (
                <span key={i} className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">
                  {flag}
                </span>
              ))}
            </div>
          )}

          {result.requires_human_review && (
            <div className="mt-3 text-sm text-yellow-400">
              Human review recommended for this content.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
