/**
 * AI Assistant Page
 * Central hub for all AI features in WickedCRM
 */

import { useState, useEffect } from 'react';
import { Bot, MessageSquare, Sparkles, Zap, Heart } from 'lucide-react';
import { AIChat } from '@/components/ai/AIChat';
import { AIMessageDraft } from '@/components/ai/AIMessageDraft';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AIHealthStatus {
  status: string;
  api_key_configured: boolean;
  models_available: number;
  message: string;
}

export default function AIAssistant() {
  const [activeTab, setActiveTab] = useState<'chat' | 'draft' | 'suggestions'>('chat');
  const [health, setHealth] = useState<AIHealthStatus | null>(null);

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
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gradient">AI Assistant</h1>
          <p className="text-muted-foreground mt-1">
            Your intelligent companion for messaging, content, and more
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
            <span className="text-muted-foreground">• {health.models_available} models</span>
          </div>
        )}
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "p-4 rounded-xl border text-left transition-all",
              activeTab === tab.id
                ? "bg-primary/20 border-primary"
                : "bg-card/50 border-white/10 hover:border-white/20"
            )}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                activeTab === tab.id ? "gradient-primary" : "bg-white/10"
              )}>
                <tab.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">{tab.label}</h3>
                <p className="text-xs text-muted-foreground">{tab.description}</p>
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
              <AIChat userId="user1" companionId="flirty" />
            </div>
          )}

          {activeTab === 'draft' && (
            <AIMessageDraft
              contactName="Your Contact"
              context="Previous conversation context here"
              onSelect={(msg) => {
                navigator.clipboard.writeText(msg);
                alert('Message copied to clipboard!');
              }}
            />
          )}

          {activeTab === 'suggestions' && (
            <ContentSuggestions />
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
                Start Flirty Chat
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('draft')}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Draft a Message
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('suggestions')}>
                <Sparkles className="w-4 h-4 mr-2" />
                Get Content Ideas
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
                name="Raven"
                tone="Flirty"
                description="Playful, confident, seductive"
                gradient="from-pink-500 to-purple-500"
              />
              <PersonalityCard
                name="Luna"
                tone="Playful"
                description="Bubbly, fun, affectionate"
                gradient="from-cyan-500 to-blue-500"
              />
              <PersonalityCard
                name="Shadow"
                tone="Mysterious"
                description="Enigmatic, intriguing, alluring"
                gradient="from-purple-500 to-indigo-500"
              />
              <PersonalityCard
                name="Morgan"
                tone="Professional"
                description="Helpful, efficient, knowledgeable"
                gradient="from-green-500 to-teal-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonalityCard({ name, tone, description, gradient }: {
  name: string;
  tone: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
      <div className={cn("w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center", gradient)}>
        <span className="text-sm font-bold text-white">{name[0]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{name}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
      <span className="text-xs bg-white/10 px-2 py-1 rounded">{tone}</span>
    </div>
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
