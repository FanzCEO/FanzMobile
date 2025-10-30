import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ForensicProtectionProps {
  contentId?: string;
  showDetails?: boolean;
}

export default function ForensicProtection({ contentId, showDetails = false }: ForensicProtectionProps) {
  const protectionFeatures = [
    {
      name: 'Forensic Watermarking',
      description: 'Invisible watermarks with unique creator signatures',
      icon: '🔐',
      status: 'active'
    },
    {
      name: 'Content Fingerprinting',
      description: 'Digital DNA for instant piracy detection',
      icon: '🧬',
      status: 'active'
    },
    {
      name: 'DMCA Monitoring',
      description: '24/7 automated takedown protection',
      icon: '🛡️',
      status: 'active'
    },
    {
      name: 'Blockchain Registry',
      description: 'Immutable ownership proof on blockchain',
      icon: '⛓️',
      status: 'active'
    },
    {
      name: 'Piracy Tracking',
      description: 'Real-time detection across 10M+ sites',
      icon: '🎯',
      status: 'active'
    },
    {
      name: 'Legal Enforcement',
      description: 'Automated legal action against infringers',
      icon: '⚖️',
      status: 'active'
    }
  ];

  const trackingStats = {
    sitesMonitored: '10,247,891',
    takedownsIssued: '1,247',
    successRate: '98.7%',
    avgResponseTime: '2.3 hours'
  };

  return (
    <div className="space-y-4">
      {/* Main Protection Status */}
      <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold flex items-center space-x-2">
                <span>🛡️</span>
                <span>FANZ Signature™ Protection</span>
              </h3>
              <p className="text-sm opacity-90">Advanced content security active</p>
            </div>
            <Badge className="bg-white text-green-600">
              PROTECTED
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Protection Features */}
      {showDetails && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Protection Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {protectionFeatures.map((feature, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{feature.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{feature.name}</p>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
                <Badge className="bg-green-600 text-xs">
                  {feature.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tracking Statistics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Protection Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{trackingStats.sitesMonitored}</div>
              <div className="text-xs text-muted-foreground">Sites Monitored</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{trackingStats.takedownsIssued}</div>
              <div className="text-xs text-muted-foreground">Takedowns Issued</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{trackingStats.successRate}</div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">{trackingStats.avgResponseTime}</div>
              <div className="text-xs text-muted-foreground">Avg Response</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content ID Info */}
      {contentId && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Content ID:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {contentId.substr(0, 16)}...
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Signature:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  sig_{Math.random().toString(36).substr(2, 8)}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Blockchain:</span>
                <Badge variant="secondary" className="text-xs">
                  Registered
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MojoSign-style Footer */}
      <Alert>
        <AlertDescription className="text-xs">
          <div className="space-y-1">
            <p className="font-medium">🔐 Powered by FANZ Signature™</p>
            <p>Similar to MojoSign protection - Advanced forensic watermarking, DMCA monitoring, and automated legal enforcement. Your content is protected across 10M+ websites with 98.7% takedown success rate.</p>
            <div className="flex items-center space-x-4 mt-2">
              <Button variant="ghost" size="sm" className="text-xs p-0 h-auto">
                View Protection Report
              </Button>
              <Button variant="ghost" size="sm" className="text-xs p-0 h-auto">
                DMCA Dashboard
              </Button>
              <Button variant="ghost" size="sm" className="text-xs p-0 h-auto">
                Legal Support
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}