import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { mockUser, platforms } from '@/lib/mockData';
import { platformManager } from '@/lib/platformConnections';

interface MobileProfileProps {
  onPageChange: (page: string) => void;
}

export default function MobileProfile({ onPageChange }: MobileProfileProps) {
  const connectedProfiles = platformManager.getConnectedProfiles();
  
  const profileStats = [
    { label: 'Total Earnings', value: '$12,847', icon: '💰' },
    { label: 'Total Followers', value: '29.1K', icon: '👥' },
    { label: 'Connected Profiles', value: connectedProfiles.length.toString(), icon: '🔗' },
    { label: 'Protected Content', value: '47', icon: '🛡️' }
  ];

  const settingsItems = [
    { label: 'Notifications', icon: '🔔', hasSwitch: true, enabled: true },
    { label: 'Auto-Upload', icon: '📤', hasSwitch: true, enabled: false },
    { label: 'AI Marketing Bot', icon: '🤖', hasSwitch: true, enabled: true },
    { label: 'CRM & Messaging', icon: '💬', hasSwitch: false, action: () => onPageChange('crm') },
    { label: 'Analytics & Reports', icon: '📊', hasSwitch: false, action: () => onPageChange('analytics') },
    { label: 'Cloud Storage', icon: '☁️', hasSwitch: false, action: () => onPageChange('storage') },
    { label: 'Privacy Settings', icon: '🔒', hasSwitch: false },
    { label: 'Payment Methods', icon: '💳', hasSwitch: false },
  ];

  const getPlatformColor = (platformName: string) => {
    switch (platformName) {
      case 'BoyFanz': return 'bg-blue-600';
      case 'GirlFanz': return 'bg-pink-600';
      case 'PupFanz': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Profile</h1>
        <Button variant="ghost" size="sm">
          ⚙️
        </Button>
      </div>

      {/* Profile Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="/avatars/01.png" alt="@alexcreator" />
              <AvatarFallback>AC</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{mockUser.handle}</h2>
              <p className="text-sm text-muted-foreground">{mockUser.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600">
                  Multi-Platform Creator
                </Badge>
                {mockUser.verified_at && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    ✓ Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <Button variant="outline" className="w-full mt-4">
            Edit Profile
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {profileStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-3 text-center">
              <div className="text-lg">{stat.icon}</div>
              <div className="text-xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Connected Platform Profiles */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Connected Platform Profiles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {connectedProfiles.map((profile) => (
            <div key={profile.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile.avatar} alt={profile.username} />
                  <AvatarFallback>
                    {profile.displayName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">{profile.displayName}</p>
                    {profile.isVerified && (
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                        ✓
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{profile.username}</p>
                  <div className="flex items-center space-x-3 mt-1">
                    <Badge className={`text-xs ${getPlatformColor(profile.platformName)}`}>
                      {profile.platformName}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      👥 {profile.followers.toLocaleString()}
                    </span>
                    <span className="text-xs text-green-600">
                      💰 ${profile.earnings.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <Switch defaultChecked={profile.isConnected} />
            </div>
          ))}
          
          <Button variant="outline" size="sm" className="w-full mt-3">
            + Connect New Profile
          </Button>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Settings & Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {settingsItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div 
                className="flex items-center space-x-3 flex-1 cursor-pointer"
                onClick={item.action}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              {item.hasSwitch ? (
                <Switch defaultChecked={item.enabled} />
              ) : (
                <Button variant="ghost" size="sm" onClick={item.action}>
                  →
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* AI Marketing Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">AI Marketing Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">1,247</div>
              <div className="text-xs text-muted-foreground">Auto Messages Sent</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">78.5%</div>
              <div className="text-xs text-muted-foreground">Response Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">247</div>
              <div className="text-xs text-muted-foreground">CRM Contacts</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">$2,847</div>
              <div className="text-xs text-muted-foreground">Message Revenue</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <div className="space-y-2">
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={() => onPageChange('crm')}
        >
          <span className="mr-3">💬</span>
          Open CRM & Messaging
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={() => onPageChange('analytics')}
        >
          <span className="mr-3">📊</span>
          View Analytics Dashboard
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={() => onPageChange('storage')}
        >
          <span className="mr-3">☁️</span>
          Manage Cloud Storage
        </Button>
        
        <Button variant="outline" className="w-full justify-start">
          <span className="mr-3">💸</span>
          Withdraw Earnings
        </Button>
        
        <Button variant="outline" className="w-full justify-start text-red-600 border-red-200">
          <span className="mr-3">🚪</span>
          Sign Out
        </Button>
      </div>

      {/* App Info */}
      <Card className="bg-muted/50">
        <CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground">
            FANZ Mobile App v2.1.0 with AI Marketing Suite
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            © 2024 FANZ Unlimited Network
          </p>
        </CardContent>
      </Card>
    </div>
  );
}