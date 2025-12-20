import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Plug, CheckCircle, XCircle, ExternalLink, MessageSquare, Phone, Calendar, Send, DollarSign, Mail, Database, Video, Github, Bot, Sparkles } from 'lucide-react';
import { integrationsApi } from '@/lib/api/integrations';
import { apiClient } from '@/lib/api/client';
import type { IntegrationProvider } from '@/types/integration';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast, toToastText } from '@/components/ui/sonner';

interface IntegrationConfig {
  provider: IntegrationProvider;
  name: string;
  description: string;
  icon: React.ReactNode;
  price: string;
  fields: { name: string; label: string; placeholder: string; type?: string }[];
  configEndpoint?: string;
  authEndpoint?: string; // OAuth endpoint
  badge?: 'free' | 'beta' | 'comingsoon' | 'premium';
  category?: 'Messaging' | 'Sync' | 'Productivity';
  comingSoon?: boolean;
  oauth?: boolean;
}

const INTEGRATION_CONFIGS: IntegrationConfig[] = [
  {
    provider: 'telegram',
    name: 'Telegram Bot',
    description: 'FREE unlimited messaging via Telegram. Create a bot at @BotFather',
    icon: <Send className="h-8 w-8 text-blue-400" />,
    price: 'FREE',
    fields: [
      { name: 'bot_token', label: 'Bot Token', placeholder: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11', type: 'password' },
    ],
    configEndpoint: '/integrations/telegram/configure',
  },
  {
    provider: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Connect via Meta Business - click to authorize with Facebook',
    icon: <Phone className="h-8 w-8 text-green-500" />,
    price: 'FREE tier',
    fields: [],
    authEndpoint: '/integrations/whatsapp/auth-url',
    oauth: true,
  },
  {
    provider: 'telnyx',
    name: 'Telnyx SMS',
    description: 'Cheap SMS at $0.004/msg (75% cheaper than Twilio)',
    icon: <MessageSquare className="h-8 w-8 text-green-400" />,
    price: '$0.004/msg',
    fields: [
      { name: 'api_key', label: 'API Key', placeholder: 'KEY01234567890ABCDEF', type: 'password' },
      { name: 'phone_number', label: 'Telnyx Phone Number', placeholder: '+1234567890' },
      { name: 'messaging_profile_id', label: 'Messaging Profile ID (optional)', placeholder: '12345678-1234-1234-1234-123456789012' },
    ],
    configEndpoint: '/integrations/telnyx/configure',
  },
  {
    provider: 'twilio',
    name: 'Twilio SMS',
    description: 'Premium SMS service, most reliable but expensive',
    icon: <MessageSquare className="h-8 w-8 text-red-500" />,
    price: '$0.0079/msg',
    fields: [
      { name: 'account_sid', label: 'Account SID', placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
      { name: 'auth_token', label: 'Auth Token', placeholder: 'Your Twilio Auth Token', type: 'password' },
      { name: 'phone_number', label: 'Twilio Phone Number', placeholder: '+1234567890' },
    ],
    configEndpoint: '/integrations/twilio/configure',
  },
  {
    provider: 'livekit',
    name: 'LiveKit (Voice/Video)',
    description: 'Real-time voice and video calls with your clients',
    icon: <Video className="h-8 w-8 text-purple-500" />,
    price: 'Pay-as-you-go',
    fields: [
      { name: 'api_key', label: 'API Key', placeholder: 'APIxxxxxxxxx', type: 'password' },
      { name: 'api_secret', label: 'API Secret', placeholder: 'Your LiveKit API Secret', type: 'password' },
      { name: 'url', label: 'LiveKit Server URL', placeholder: 'wss://your-project.livekit.cloud' },
    ],
    configEndpoint: '/integrations/livekit/configure',
  },
  {
    provider: 'github',
    name: 'GitHub',
    description: 'Connect your GitHub account for repository access',
    icon: <Github className="h-8 w-8 text-white" />,
    price: 'FREE',
    fields: [],
    authEndpoint: '/integrations/github/auth-url',
    oauth: true,
  },
  {
    provider: 'anthropic',
    name: 'Anthropic (Claude)',
    description: 'Use Claude AI for chat, content generation, and intelligent responses',
    icon: <Sparkles className="h-8 w-8 text-orange-400" />,
    price: 'Pay-as-you-go',
    fields: [
      { name: 'api_key', label: 'Anthropic API Key', placeholder: 'sk-ant-api...', type: 'password' },
    ],
    configEndpoint: '/integrations/anthropic/configure',
    category: 'Productivity',
  },
  {
    provider: 'openai',
    name: 'OpenAI (GPT)',
    description: 'Use GPT-4 and other OpenAI models for AI features',
    icon: <Bot className="h-8 w-8 text-green-400" />,
    price: 'Pay-as-you-go',
    fields: [
      { name: 'api_key', label: 'OpenAI API Key', placeholder: 'sk-...', type: 'password' },
    ],
    configEndpoint: '/integrations/openai/configure',
    category: 'Productivity',
  },
  {
    provider: 'google_calendar',
    name: 'Google Calendar',
    description: 'Sync events with Google Calendar - click to sign in with Google',
    icon: <Calendar className="h-8 w-8 text-blue-500" />,
    price: 'FREE',
    fields: [],
    authEndpoint: '/integrations/google/auth-url',
    oauth: true,
  },
  {
    provider: 'outlook',
    name: 'Microsoft Outlook',
    description: 'Sync events with Outlook Calendar',
    icon: <Calendar className="h-8 w-8 text-sky-500" />,
    price: 'FREE',
    fields: [],
    badge: 'comingsoon',
    comingSoon: true,
  },
  {
    provider: 'slack',
    name: 'Slack',
    description: 'DMs and channels for team collaboration',
    icon: <MessageSquare className="h-8 w-8 text-purple-400" />,
    price: 'Coming soon',
    fields: [],
    badge: 'comingsoon',
    category: 'Messaging',
    comingSoon: true,
  },
  {
    provider: 'discord',
    name: 'Discord',
    description: 'Community channels and DMs for fans',
    icon: <MessageSquare className="h-8 w-8 text-indigo-400" />,
    price: 'Coming soon',
    fields: [],
    badge: 'comingsoon',
    category: 'Messaging',
    comingSoon: true,
  },
  {
    provider: 'gmail',
    name: 'Gmail / IMAP',
    description: 'Sync email threads (read-only to start)',
    icon: <Mail className="h-8 w-8 text-red-400" />,
    price: 'Beta soon',
    fields: [],
    badge: 'beta',
    category: 'Messaging',
    comingSoon: true,
  },
  {
    provider: 'webhook',
    name: 'Webhooks & Zapier',
    description: 'Send events to Zapier, Make, or custom URLs',
    icon: <ExternalLink className="h-8 w-8 text-amber-400" />,
    price: 'Beta soon',
    fields: [],
    badge: 'beta',
    category: 'Productivity',
    comingSoon: true,
  },
  {
    provider: 'notion',
    name: 'Notion CRM',
    description: 'Sync contacts and deals into Notion databases',
    icon: <Database className="h-8 w-8 text-teal-400" />,
    price: 'Coming soon',
    fields: [],
    badge: 'comingsoon',
    category: 'Productivity',
    comingSoon: true,
  },
];

const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const withApiPath = (path: string) => (path.startsWith('/api') ? path : `/api${path}`);

export default function Integrations() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [configDialog, setConfigDialog] = useState<IntegrationConfig | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [sendDialog, setSendDialog] = useState<{ provider: string; type: string } | null>(null);
  const [sendData, setSendData] = useState({ to: '', body: '' });
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  // Handle OAuth callback messages
  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected) {
      toast.success(`${connected.charAt(0).toUpperCase() + connected.slice(1)} connected successfully!`);
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      setSearchParams({});
    }

    if (error) {
      toast.error(`Failed to connect: ${error.replace(/_/g, ' ')}`);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, queryClient]);

  const { data: integrations = [] } = useQuery({
    queryKey: ['integrations'],
    queryFn: integrationsApi.getIntegrations,
  });

  const connectMutation = useMutation({
    mutationFn: async ({ config, data }: { config: IntegrationConfig; data: Record<string, string> }) => {
      if (config.configEndpoint) {
        const response = await apiClient.post(withApiPath(config.configEndpoint), data);
        return response.data;
      }
      return integrationsApi.connectIntegration({
        provider: config.provider,
        metadata: data,
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success(result.message || 'Integration connected successfully!');
      setConfigDialog(null);
      setFormData({});
    },
    onError: (error: Error) => {
      toast.error(`Failed to connect: ${error.message}`);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: integrationsApi.disconnectIntegration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Integration disconnected');
    },
    onError: (error: Error) => {
      toast.error(`Failed to disconnect: ${error.message}`);
    },
  });

  const handleConnect = async (config: IntegrationConfig) => {
    if (config.comingSoon) {
      toast.info(`${config.name} is coming soon. Join the waitlist to get access first.`);
      return;
    }

    // OAuth flow - redirect to provider
    if (config.oauth && config.authEndpoint) {
      setOauthLoading(config.provider);
      try {
        const response = await apiClient.get(withApiPath(config.authEndpoint));
        const data = response.data;

        if (data.auth_url) {
          // Redirect to OAuth provider
          window.location.href = data.auth_url;
        } else if (data.instructions) {
          // Show instructions (like for Telegram)
          toast.info(data.instructions.join('\n'));
          setOauthLoading(null);
        } else {
          toast.error('OAuth not configured for this integration');
          setOauthLoading(null);
        }
      } catch (error: unknown) {
        const axiosError = error as { response?: { data?: { detail?: string } }; message?: string };
        toast.error(axiosError.response?.data?.detail || 'Failed to start OAuth flow');
        setOauthLoading(null);
      }
      return;
    }

    // Manual config flow
    if (config.fields.length === 0) {
      toast.info('No configuration needed for this integration');
    } else {
      setConfigDialog(config);
      setFormData({});
    }
  };

  const handleSubmitConfig = async () => {
    if (!configDialog) return;
    connectMutation.mutate({ config: configDialog, data: formData });
  };

  const handleDisconnect = (integrationId: string) => {
    if (confirm('Are you sure you want to disconnect this integration?')) {
      disconnectMutation.mutate(integrationId);
    }
  };

  const handleSendMessage = async () => {
    if (!sendDialog) return;

    const endpoints: Record<string, string> = {
      telegram: '/integrations/telegram/send',
      telnyx: '/integrations/telnyx/send',
      twilio: '/integrations/twilio/send',
      whatsapp: '/integrations/whatsapp/send',
    };

    try {
      await apiClient.post(
        withApiPath(endpoints[sendDialog.provider]),
        sendDialog.provider === 'telegram'
          ? { chat_id: sendData.to, message: sendData.body }
          : { to: sendData.to, body: sendData.body, message: sendData.body }
      );

      toast.success('Message sent successfully!');
      setSendDialog(null);
      setSendData({ to: '', body: '' });
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown }; message?: string };
      const errorData = axiosError.response?.data ?? axiosError.message ?? error;
      toast.error(toToastText(errorData) || 'Failed to send message');
    }
  };

  const isConnected = (provider: string) => integrations.some((i) => i.provider === provider && i.is_active);
  const getIntegration = (provider: string) => integrations.find((i) => i.provider === provider);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Integrations</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Connect messaging platforms - from FREE to premium
          </p>
        </div>
      </div>

      {/* Quick Send Buttons */}
      {(isConnected('telegram') || isConnected('telnyx') || isConnected('twilio') || isConnected('whatsapp')) && (
        <Card className="glass-panel p-4">
          <div className="flex flex-wrap gap-2">
            {isConnected('telegram') && (
              <Button onClick={() => setSendDialog({ provider: 'telegram', type: 'Telegram' })} variant="outline" size="sm">
                <Send className="h-4 w-4 mr-2 text-blue-400" /> Send Telegram
              </Button>
            )}
            {isConnected('telnyx') && (
              <Button onClick={() => setSendDialog({ provider: 'telnyx', type: 'SMS (Telnyx)' })} variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-2 text-green-400" /> Send SMS
              </Button>
            )}
            {isConnected('whatsapp') && (
              <Button onClick={() => setSendDialog({ provider: 'whatsapp', type: 'WhatsApp' })} variant="outline" size="sm">
                <Phone className="h-4 w-4 mr-2 text-green-500" /> Send WhatsApp
              </Button>
            )}
            {isConnected('twilio') && !isConnected('telnyx') && (
              <Button onClick={() => setSendDialog({ provider: 'twilio', type: 'SMS (Twilio)' })} variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-2 text-red-500" /> Send SMS
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {INTEGRATION_CONFIGS.map((config) => {
          const connected = isConnected(config.provider);
          const integration = getIntegration(config.provider);
          const isLoading = oauthLoading === config.provider;

          return (
            <Card key={config.provider} className="glass-panel p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-bold text-base sm:text-lg">{config.name}</h3>
                    <Badge
                      variant={config.badge === 'comingsoon' ? 'secondary' : 'outline'}
                      className={`text-xs ${
                        config.badge === 'comingsoon'
                          ? 'bg-white/10 text-muted-foreground'
                          : config.price === 'FREE'
                          ? 'text-green-400 border-green-400'
                          : 'text-yellow-400 border-yellow-400'
                      }`}
                    >
                      <DollarSign className="h-3 w-3 mr-1" />
                      {config.price}
                    </Badge>
                    {config.oauth && (
                      <Badge variant="outline" className="text-xs text-blue-400 border-blue-400">OAuth</Badge>
                    )}
                    {config.badge === 'beta' && (
                      <Badge variant="outline" className="text-xs text-amber-400 border-amber-400">Beta</Badge>
                    )}
                    {config.badge === 'comingsoon' && (
                      <Badge variant="outline" className="text-xs text-muted-foreground border-muted-foreground/50">Coming soon</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {connected ? (
                      <Badge className="bg-green-500/20 text-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        <XCircle className="h-3 w-3 mr-1" />
                        Not Connected
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">{config.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {connected ? (
                      <>
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => handleConnect(config)}>
                          {config.oauth ? 'Reconnect' : 'Configure'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive text-xs"
                          onClick={() => integration && handleDisconnect(integration.id)}
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : config.comingSoon ? (
                      <Button size="sm" variant="outline" className="text-xs" disabled>
                        Coming soon
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="gradient-primary text-xs"
                        onClick={() => handleConnect(config)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>Loading...</>
                        ) : config.oauth ? (
                          <>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Sign in with {config.name.split(' ')[0]}
                          </>
                        ) : (
                          <>
                            <Plug className="h-4 w-4 mr-2" />
                            Connect
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Setup Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Card className="glass-panel p-4 sm:p-6 border-blue-500/50">
          <div className="flex items-start gap-3 sm:gap-4">
            <Send className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400 flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="font-bold text-base sm:text-lg mb-2">Setting Up Telegram (FREE)</h3>
              <ol className="text-xs sm:text-sm text-muted-foreground space-y-1 sm:space-y-2 list-decimal list-inside">
                <li>Message <a href="https://t.me/BotFather" target="_blank" rel="noopener" className="text-blue-400 hover:underline">@BotFather</a></li>
                <li>Send /newbot and follow prompts</li>
                <li>Copy the bot token</li>
                <li>Paste it above and connect</li>
              </ol>
            </div>
          </div>
        </Card>

        <Card className="glass-panel p-4 sm:p-6 border-green-500/50">
          <div className="flex items-start gap-3 sm:gap-4">
            <Phone className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="font-bold text-base sm:text-lg mb-2">WhatsApp Business (OAuth)</h3>
              <ol className="text-xs sm:text-sm text-muted-foreground space-y-1 sm:space-y-2 list-decimal list-inside">
                <li>Click "Sign in with WhatsApp"</li>
                <li>Authorize with your Facebook account</li>
                <li>Select your WhatsApp Business account</li>
                <li>You'll be redirected back when done</li>
              </ol>
            </div>
          </div>
        </Card>
      </div>

      {/* Configuration Dialog */}
      <Dialog open={!!configDialog} onOpenChange={() => setConfigDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configure {configDialog?.name}</DialogTitle>
            <DialogDescription>{configDialog?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {configDialog?.fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>{field.label}</Label>
                <Input
                  id={field.name}
                  type={field.type || 'text'}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfigDialog(null)}>Cancel</Button>
            <Button onClick={handleSubmitConfig} disabled={connectMutation.isPending} className="gradient-primary">
              {connectMutation.isPending ? 'Connecting...' : 'Save & Connect'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={!!sendDialog} onOpenChange={() => setSendDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send {sendDialog?.type}</DialogTitle>
            <DialogDescription>
              {sendDialog?.provider === 'telegram' ? 'Enter chat ID (from Telegram updates)' : 'Enter phone number'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="to">{sendDialog?.provider === 'telegram' ? 'Chat ID' : 'Phone Number'}</Label>
              <Input
                id="to"
                placeholder={sendDialog?.provider === 'telegram' ? '123456789' : '+1234567890'}
                value={sendData.to}
                onChange={(e) => setSendData({ ...sendData, to: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <Input
                id="body"
                placeholder="Your message..."
                value={sendData.body}
                onChange={(e) => setSendData({ ...sendData, body: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSendDialog(null)}>Cancel</Button>
            <Button onClick={handleSendMessage} className="gradient-primary">
              <Send className="h-4 w-4 mr-2" /> Send
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
