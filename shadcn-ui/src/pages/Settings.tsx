import { useState } from 'react';
import { User, Key, Bell, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';

export default function Settings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
  });

  const handleSaveProfile = () => {
    toast.success('Profile updated successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gradient">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="glass-panel">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="api">
            <Key className="h-4 w-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="glass-panel p-6">
            <h2 className="text-xl font-bold mb-6">Profile Information</h2>
            <div className="space-y-4 max-w-md">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="mt-1"
                />
              </div>
              <Button onClick={handleSaveProfile} className="gradient-primary">
                Save Changes
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api">
          <Card className="glass-panel p-6">
            <h2 className="text-xl font-bold mb-6">API Configuration</h2>
            <div className="space-y-4 max-w-md">
              <div>
                <Label htmlFor="openai_key">OpenAI API Key</Label>
                <Input
                  id="openai_key"
                  type="password"
                  placeholder="sk-..."
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Used for AI message processing
                </p>
              </div>
              <div>
                <Label htmlFor="twilio_sid">Twilio Account SID</Label>
                <Input
                  id="twilio_sid"
                  type="password"
                  placeholder="AC..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="twilio_token">Twilio Auth Token</Label>
                <Input
                  id="twilio_token"
                  type="password"
                  placeholder="..."
                  className="mt-1"
                />
              </div>
              <Button className="gradient-primary">
                Save API Keys
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="glass-panel p-6">
            <h2 className="text-xl font-bold mb-6">Notification Preferences</h2>
            <div className="space-y-6 max-w-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New Messages</p>
                  <p className="text-sm text-muted-foreground">Get notified about new messages</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Meeting Reminders</p>
                  <p className="text-sm text-muted-foreground">Reminders before scheduled events</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">AI Processing</p>
                  <p className="text-sm text-muted-foreground">Notifications when AI processes messages</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Workflow Triggers</p>
                  <p className="text-sm text-muted-foreground">Alerts when workflows are triggered</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card className="glass-panel p-6">
            <h2 className="text-xl font-bold mb-6">Security Settings</h2>
            <div className="space-y-4 max-w-md">
              <div>
                <Label htmlFor="current_password">Current Password</Label>
                <Input
                  id="current_password"
                  type="password"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="new_password">New Password</Label>
                <Input
                  id="new_password"
                  type="password"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="confirm_password">Confirm New Password</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  className="mt-1"
                />
              </div>
              <Button className="gradient-primary">
                Change Password
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}