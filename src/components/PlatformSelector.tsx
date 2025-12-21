import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { platformManager, PlatformProfile } from '@/lib/platformConnections';

interface PlatformSelectorProps {
  selectedProfiles: string[];
  onSelectionChange: (profileIds: string[]) => void;
  showEarnings?: boolean;
}

export default function PlatformSelector({ 
  selectedProfiles, 
  onSelectionChange, 
  showEarnings = false 
}: PlatformSelectorProps) {
  const [profiles] = useState<PlatformProfile[]>(platformManager.getProfiles());
  const connectedProfiles = profiles.filter(p => p.isConnected);

  const handleProfileToggle = (profileId: string, isSelected: boolean) => {
    if (isSelected) {
      onSelectionChange([...selectedProfiles, profileId]);
    } else {
      onSelectionChange(selectedProfiles.filter(id => id !== profileId));
    }
  };

  const selectAll = () => {
    onSelectionChange(connectedProfiles.map(p => p.id));
  };

  const selectNone = () => {
    onSelectionChange([]);
  };

  const groupedProfiles = connectedProfiles.reduce((acc, profile) => {
    if (!acc[profile.platformName]) {
      acc[profile.platformName] = [];
    }
    acc[profile.platformName].push(profile);
    return acc;
  }, {} as Record<string, PlatformProfile[]>);

  const getPlatformColor = (platformName: string) => {
    switch (platformName) {
      case 'BoyFanz': return 'bg-blue-600';
      case 'GirlFanz': return 'bg-pink-600';
      case 'PupFanz': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Select Platforms & Profiles</CardTitle>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" onClick={selectAll}>
              All
            </Button>
            <Button variant="ghost" size="sm" onClick={selectNone}>
              None
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {Object.entries(groupedProfiles).map(([platformName, platformProfiles]) => (
          <div key={platformName} className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getPlatformColor(platformName)}`} />
              <h4 className="font-medium text-sm">{platformName}</h4>
              <Badge variant="secondary" className="text-xs">
                {platformProfiles.length} profiles
              </Badge>
            </div>
            
            <div className="space-y-2 ml-5">
              {platformProfiles.map((profile) => (
                <div key={profile.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile.avatar} alt={profile.username} />
                      <AvatarFallback>
                        {profile.displayName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-sm">{profile.displayName}</p>
                        {profile.isVerified && (
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                            ✓ Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{profile.username}</p>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-xs text-muted-foreground">
                          👥 {profile.followers.toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          📈 {profile.engagement}%
                        </span>
                        {showEarnings && (
                          <span className="text-xs text-green-600 font-medium">
                            💰 ${profile.earnings.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Switch
                    checked={selectedProfiles.includes(profile.id)}
                    onCheckedChange={(checked) => handleProfileToggle(profile.id, checked)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {connectedProfiles.length === 0 && (
          <Alert>
            <AlertDescription className="text-center">
              <div className="space-y-2">
                <p className="font-medium">No connected profiles</p>
                <p className="text-xs">Connect your platform accounts to start uploading content.</p>
                <Button size="sm" variant="outline">
                  Connect Platforms
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {selectedProfiles.length > 0 && (
          <Alert>
            <AlertDescription>
              <div className="flex items-center space-x-2">
                <span>📤</span>
                <span className="text-sm">
                  Content will be uploaded to {selectedProfiles.length} selected profile{selectedProfiles.length > 1 ? 's' : ''}
                </span>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}