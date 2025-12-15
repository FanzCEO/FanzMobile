/**
 * AI Message Draft Component
 * Generates AI-powered message drafts for contacts
 */

import { useState } from 'react';
import { Sparkles, Copy, RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface AIMessageDraftProps {
  contactName: string;
  context?: string;
  onSelect?: (message: string) => void;
}

const API_BASE = '/api/ai';

const TONES = [
  { id: 'friendly', label: 'Friendly', emoji: '😊' },
  { id: 'professional', label: 'Professional', emoji: '💼' },
  { id: 'flirty', label: 'Flirty', emoji: '😘' },
  { id: 'casual', label: 'Casual', emoji: '👋' },
];

const MESSAGE_TYPES = [
  { id: 'follow_up', label: 'Follow Up' },
  { id: 'introduction', label: 'Introduction' },
  { id: 'thank_you', label: 'Thank You' },
  { id: 'reminder', label: 'Reminder' },
  { id: 'promotional', label: 'Promotional' },
  { id: 'flirty', label: 'Flirty' },
];

export function AIMessageDraft({ contactName, context = '', onSelect }: AIMessageDraftProps) {
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [tone, setTone] = useState('friendly');
  const [messageType, setMessageType] = useState('follow_up');
  const [contextInput, setContextInput] = useState(context);
  const [copied, setCopied] = useState(false);

  const generateDraft = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/draft-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_name: contactName,
          context: contextInput || `Sending a ${messageType} message`,
          tone,
          message_type: messageType
        })
      });

      const data = await response.json();
      setDraft(data.draft);
    } catch (error) {
      console.error('Failed to generate draft:', error);
      setDraft('Failed to generate message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-card/50 rounded-xl border border-white/10 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">AI Message Draft</h3>
      </div>

      {/* Context Input */}
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Context (optional)</label>
        <Textarea
          value={contextInput}
          onChange={(e) => setContextInput(e.target.value)}
          placeholder="Add any context about your relationship or what you want to say..."
          className="bg-white/5 border-white/10 min-h-[60px]"
        />
      </div>

      {/* Tone Selection */}
      <div>
        <label className="text-sm text-muted-foreground mb-2 block">Tone</label>
        <div className="flex flex-wrap gap-2">
          {TONES.map(t => (
            <button
              key={t.id}
              onClick={() => setTone(t.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm transition-all",
                tone === t.id
                  ? "bg-primary text-white"
                  : "bg-white/5 hover:bg-white/10"
              )}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message Type */}
      <div>
        <label className="text-sm text-muted-foreground mb-2 block">Message Type</label>
        <div className="flex flex-wrap gap-2">
          {MESSAGE_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => setMessageType(t.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm transition-all",
                messageType === t.id
                  ? "bg-secondary text-white"
                  : "bg-white/5 hover:bg-white/10"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <Button
        onClick={generateDraft}
        disabled={loading}
        className="w-full gradient-primary"
      >
        {loading ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Message for {contactName}
          </>
        )}
      </Button>

      {/* Draft Output */}
      {draft && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground">Generated Draft</label>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={generateDraft}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <p className="text-sm whitespace-pre-wrap">{draft}</p>
          </div>
          {onSelect && (
            <Button onClick={() => onSelect(draft)} className="w-full">
              Use This Message
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
