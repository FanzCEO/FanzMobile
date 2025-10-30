import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface MobileComplianceProps {
  onPageChange: (page: string) => void;
}

export default function MobileCompliance({ onPageChange }: MobileComplianceProps) {
  const complianceScore = 96;
  
  const verificationItems = [
    { label: 'Identity Verification', status: 'verified', icon: '✅' },
    { label: 'Age Verification', status: 'verified', icon: '✅' },
    { label: 'Bank Account', status: 'verified', icon: '✅' },
    { label: 'Tax Information', status: 'pending', icon: '⏳' },
  ];

  const recentActivity = [
    { action: 'Co-star verification completed', time: '2 hours ago', status: 'success' },
    { action: 'New content uploaded', time: '4 hours ago', status: 'info' },
    { action: 'Compliance check passed', time: '1 day ago', status: 'success' },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => onPageChange('dashboard')}>
          ← Back
        </Button>
        <h1 className="text-lg font-semibold">Compliance</h1>
        <Button variant="ghost" size="sm">
          ℹ️
        </Button>
      </div>

      {/* Compliance Score */}
      <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <CardContent className="p-4 text-center">
          <div className="text-3xl font-bold">{complianceScore}%</div>
          <div className="text-sm opacity-90">Compliance Score</div>
          <div className="mt-2">
            <Progress value={complianceScore} className="h-2 bg-white/20" />
          </div>
        </CardContent>
      </Card>

      {/* Verification Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Verification Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {verificationItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <Badge 
                variant={item.status === 'verified' ? 'default' : 'secondary'}
                className={item.status === 'verified' ? 'bg-green-600' : ''}
              >
                {item.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="space-y-3">
        <Button className="w-full justify-start h-12" variant="outline">
          <span className="mr-3 text-lg">📄</span>
          <div className="text-left">
            <div className="font-medium text-sm">Update Tax Information</div>
            <div className="text-xs text-muted-foreground">Complete your W-9 form</div>
          </div>
        </Button>

        <Button className="w-full justify-start h-12" variant="outline">
          <span className="mr-3 text-lg">👥</span>
          <div className="text-left">
            <div className="font-medium text-sm">Manage Co-stars</div>
            <div className="text-xs text-muted-foreground">Add or verify collaborators</div>
          </div>
        </Button>

        <Button className="w-full justify-start h-12" variant="outline">
          <span className="mr-3 text-lg">📋</span>
          <div className="text-left">
            <div className="font-medium text-sm">2257 Records</div>
            <div className="text-xs text-muted-foreground">View compliance documentation</div>
          </div>
        </Button>
      </div>

      {/* Important Notice */}
      <Alert>
        <AlertDescription className="text-xs">
          <div className="space-y-2">
            <p className="font-medium">18 U.S.C. §2257 Compliance</p>
            <p>All performers must maintain valid ID verification. Records are kept for audit purposes and legal compliance.</p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                activity.status === 'success' ? 'bg-green-600' :
                activity.status === 'info' ? 'bg-blue-600' : 'bg-yellow-600'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{activity.action}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🆘</span>
            <div>
              <p className="text-sm font-medium">Need Help?</p>
              <p className="text-xs text-muted-foreground">Contact compliance support 24/7</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full mt-3">
            Contact Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}