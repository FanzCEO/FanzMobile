/**
 * AI Chat Component
 * Provides AI companion chat interface for WickedCRM
 */

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';

interface Message {
  role: 'user' | 'companion';
  content: string;
  emotion?: string;
  timestamp: Date;
}

interface Companion {
  id: string;
  name: string;
  tone: string;
  traits: string[];
  description: string;
}

interface AIChatProps {
  userId?: string;
  companionId?: string;
  onCompanionChange?: (id: string) => void;
  model?: string;
  presetPrompts?: string[];
  onClose?: () => void;
}

const API_PATH = '/api/ai';

export function AIChat({
  userId = 'user1',
  companionId = 'flirty',
  onCompanionChange,
  model,
  presetPrompts = [],
  onClose,
}: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [selectedCompanion, setSelectedCompanion] = useState<string>(companionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load companions on mount
  useEffect(() => {
    fetchCompanions();
  }, []);

  // Sync companion when parent changes
  useEffect(() => {
    if (companionId && companionId !== selectedCompanion) {
      setSelectedCompanion(companionId);
      setMessages([]);
    }
  }, [companionId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchCompanions = async () => {
    try {
      const response = await apiClient.get(`${API_PATH}/companions`);
      setCompanions(response.data.companions || []);
    } catch (error) {
      console.error('Failed to fetch companions:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await apiClient.post(`${API_PATH}/chat`, {
        user_id: userId,
        companion_id: selectedCompanion,
        message: input,
        model,
      });

      const data = response.data;

      const companionMessage: Message = {
        role: 'companion',
        content: data.message,
        emotion: data.emotion,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, companionMessage]);
    } catch (error) {
      console.error('Chat failed:', error);
      setMessages(prev => [...prev, {
        role: 'companion',
        content: 'Sorry, I had trouble connecting. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    try {
      await apiClient.delete(`${API_PATH}/conversation/${userId}/${selectedCompanion}`);
      setMessages([]);
    } catch (error) {
      console.error('Failed to clear chat:', error);
    }
  };

  const currentCompanion = companions.find(c => c.id === selectedCompanion);

  return (
    <div className="flex flex-col h-full bg-card/50 rounded-xl border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold">{currentCompanion?.name || 'AI Companion'}</h3>
            <p className="text-xs text-muted-foreground capitalize">{currentCompanion?.tone} mood</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedCompanion}
            onChange={(e) => {
              setSelectedCompanion(e.target.value);
              onCompanionChange?.(e.target.value);
              setMessages([]);
            }}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm"
          >
            {companions.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <Button variant="ghost" size="icon" onClick={clearChat} title="Clear chat">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {presetPrompts.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-2">
            {presetPrompts.map((prompt) => (
              <button
                key={prompt}
                className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                onClick={() => setInput(prompt)}
                type="button"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {messages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Start a conversation with {currentCompanion?.name || 'your AI companion'}</p>
            <p className="text-sm mt-2">{currentCompanion?.description}</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-3",
              msg.role === 'user' ? "justify-end" : "justify-start"
            )}
          >
            {msg.role === 'companion' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[70%] rounded-2xl px-4 py-2",
                msg.role === 'user'
                  ? "bg-primary text-white rounded-tr-none"
                  : "bg-white/10 rounded-tl-none"
              )}
            >
              <p className="text-sm">{msg.content}</p>
              {msg.emotion && (
                <p className="text-xs mt-1 opacity-60 capitalize">Feeling {msg.emotion}</p>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Bot className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="bg-white/10 rounded-2xl rounded-tl-none px-4 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-white/5 border-white/10"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
