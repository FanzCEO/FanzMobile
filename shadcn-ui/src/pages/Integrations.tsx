import { useQuery } from '@tanstack/react-query';
import { Plug, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { integrationsApi } from '@/lib/api/integrations';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Integrations() {
  const { data: integrations = [] } = useQuery({
    queryKey: ['integrations'],
    queryFn: integrationsApi.getIntegrations,
  });

  const availableIntegrations = [
    {
      provider: 'twilio',
      name: 'Twilio SMS',
      description: 'Send and receive SMS messages',
      icon: '/assets/integration-twilio.png',
      connected: integrations.some((i) => i.provider === 'twilio'),
    },
    {
      provider: 'google_calendar',
      name: 'Google Calendar',
      description: 'Sync events with Google Calendar',
      icon: '/assets/integration-google-calendar.png',
      connected: integrations.some((i) => i.provider === 'google_calendar'),
    },
    {
      provider: 'outlook',
      name: 'Microsoft Outlook',
      description: 'Sync events with Outlook Calendar',
      icon: '/assets/integration-outlook.png',
      connected: integrations.some((i) => i.provider === 'outlook'),
    },
    {
      provider: 'rm_chat',
      name: 'RM Chat',
      description: 'Connect to RM messaging platform',
      icon: '/assets/integration-twilio_variant_1.png',
      connected: integrations.some((i) => i.provider === 'rm_chat'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Integrations</h1>
          <p className="text-muted-foreground mt-1">
            Connect your favorite tools and services
          </p>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {availableIntegrations.map((integration) => (
          <Card key={integration.provider} className="glass-panel p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <img
                  src={integration.icon}
                  alt={integration.name}
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-lg">{integration.name}</h3>
                  {integration.connected ? (
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
                <p className="text-sm text-muted-foreground mb-4">{integration.description}</p>
                <div className="flex gap-2">
                  {integration.connected ? (
                    <>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive">
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" className="gradient-primary">
                      <Plug className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      <Card className="glass-panel p-6 border-accent/50">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0">
            <ExternalLink className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">Need a Custom Integration?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              We can help you connect to any service with an API. Contact our team to discuss
              custom integrations for your specific needs.
            </p>
            <Button variant="outline" size="sm">
              Contact Support
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}