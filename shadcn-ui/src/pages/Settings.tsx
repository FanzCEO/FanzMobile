import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Key, Bell, Shield, Palette, Accessibility, FileText, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const {
    fontSize,
    reducedMotion,
    highContrast,
    screenReaderOptimized,
    setFontSize,
    setReducedMotion,
    setHighContrast,
    setScreenReaderOptimized,
    resetToDefaults,
  } = useAccessibility();

  const [profile, setProfile] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
  });

  const [apiKeys, setApiKeys] = useState({
    openai_key: '',
    twilio_sid: '',
    twilio_token: '',
    huggingface_token: '',
    huggingface_endpoint: '',
  });

  const handleSaveProfile = () => {
    toast.success('Profile updated successfully');
  };

  const handleSaveApiKeys = () => {
    toast.success('API settings saved');
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
        <TabsList className="glass-panel flex-wrap">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="accessibility">
            <Accessibility className="h-4 w-4 mr-2" />
            Accessibility
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
          <TabsTrigger value="legal">
            <FileText className="h-4 w-4 mr-2" />
            Legal
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

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card className="glass-panel p-6">
            <h2 className="text-xl font-bold mb-6">Appearance</h2>
            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium mb-4 block">Theme</Label>
                <div className="grid grid-cols-3 gap-4 max-w-md">
                  <button
                    onClick={() => setTheme('light')}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all',
                      theme === 'light'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <div className="w-full aspect-video rounded bg-white border mb-2 flex items-center justify-center">
                      <div className="w-8 h-1 bg-gray-300 rounded" />
                    </div>
                    <span className="text-sm font-medium">Light</span>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all',
                      theme === 'dark'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <div className="w-full aspect-video rounded bg-gray-900 border border-gray-700 mb-2 flex items-center justify-center">
                      <div className="w-8 h-1 bg-gray-600 rounded" />
                    </div>
                    <span className="text-sm font-medium">Dark</span>
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all',
                      theme === 'system'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <div className="w-full aspect-video rounded overflow-hidden mb-2 flex border">
                      <div className="w-1/2 bg-white flex items-center justify-center">
                        <div className="w-4 h-1 bg-gray-300 rounded" />
                      </div>
                      <div className="w-1/2 bg-gray-900 flex items-center justify-center">
                        <div className="w-4 h-1 bg-gray-600 rounded" />
                      </div>
                    </div>
                    <span className="text-sm font-medium">System</span>
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Current: {resolvedTheme === 'dark' ? 'Dark' : 'Light'} mode
                  {theme === 'system' && ' (following system preference)'}
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Accessibility Tab */}
        <TabsContent value="accessibility">
          <Card className="glass-panel p-6">
            <h2 className="text-xl font-bold mb-6">Accessibility</h2>
            <div className="space-y-8 max-w-lg">
              {/* Font Size */}
              <div>
                <Label className="text-base font-medium mb-4 block">Font Size</Label>
                <div className="grid grid-cols-4 gap-2">
                  {(['small', 'medium', 'large', 'extra-large'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => setFontSize(size)}
                      className={cn(
                        'p-3 rounded-lg border-2 transition-all text-center',
                        fontSize === size
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <span
                        className={cn(
                          'block font-medium',
                          size === 'small' && 'text-sm',
                          size === 'medium' && 'text-base',
                          size === 'large' && 'text-lg',
                          size === 'extra-large' && 'text-xl'
                        )}
                      >
                        Aa
                      </span>
                      <span className="text-xs text-muted-foreground capitalize mt-1 block">
                        {size.replace('-', ' ')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Motion */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Reduce Motion</p>
                  <p className="text-sm text-muted-foreground">
                    Minimize animations and transitions
                  </p>
                </div>
                <Switch
                  checked={reducedMotion}
                  onCheckedChange={setReducedMotion}
                  aria-label="Reduce motion"
                />
              </div>

              {/* High Contrast */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">High Contrast</p>
                  <p className="text-sm text-muted-foreground">
                    Increase color contrast for better visibility
                  </p>
                </div>
                <Switch
                  checked={highContrast}
                  onCheckedChange={setHighContrast}
                  aria-label="High contrast"
                />
              </div>

              {/* Screen Reader */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Screen Reader Optimized</p>
                  <p className="text-sm text-muted-foreground">
                    Optimize layout for screen readers
                  </p>
                </div>
                <Switch
                  checked={screenReaderOptimized}
                  onCheckedChange={setScreenReaderOptimized}
                  aria-label="Screen reader optimized"
                />
              </div>

              {/* Reset */}
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    resetToDefaults();
                    toast.success('Accessibility settings reset to defaults');
                  }}
                >
                  Reset to Defaults
                </Button>
              </div>
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
                  value={apiKeys.openai_key}
                  onChange={(e) => setApiKeys({ ...apiKeys, openai_key: e.target.value })}
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
                  value={apiKeys.twilio_sid}
                  onChange={(e) => setApiKeys({ ...apiKeys, twilio_sid: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="twilio_token">Twilio Auth Token</Label>
                <Input
                  id="twilio_token"
                  type="password"
                  placeholder="..."
                  value={apiKeys.twilio_token}
                  onChange={(e) => setApiKeys({ ...apiKeys, twilio_token: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="pt-2">
                <Label htmlFor="huggingface_token">Hugging Face API Token</Label>
                <Input
                  id="huggingface_token"
                  type="password"
                  placeholder="hf_..."
                  value={apiKeys.huggingface_token}
                  onChange={(e) => setApiKeys({ ...apiKeys, huggingface_token: e.target.value })}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Used for Hugging Face Inference endpoints or hosted models
                </p>
              </div>
              <div>
                <Label htmlFor="huggingface_endpoint">Hugging Face Inference URL</Label>
                <Input
                  id="huggingface_endpoint"
                  type="url"
                  placeholder="https://api-inference.huggingface.co/models/your-model"
                  value={apiKeys.huggingface_endpoint}
                  onChange={(e) => setApiKeys({ ...apiKeys, huggingface_endpoint: e.target.value })}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional: custom inference endpoint URL
                </p>
              </div>
              <Button className="gradient-primary" onClick={handleSaveApiKeys}>
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

        {/* Legal Tab */}
        <TabsContent value="legal">
          <Card className="glass-panel p-6">
            <h2 className="text-xl font-bold mb-6">Legal Documents</h2>
            <div className="space-y-4 max-w-md">
              <button
                onClick={() => navigate('/privacy')}
                className="w-full flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="font-medium">Privacy Policy</p>
                    <p className="text-sm text-muted-foreground">How we handle your data</p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </button>

              <button
                onClick={() => navigate('/terms')}
                className="w-full flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="font-medium">Terms of Service</p>
                    <p className="text-sm text-muted-foreground">Rules for using WickedCRM</p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </button>

              <button
                onClick={() => navigate('/delete-account')}
                className="w-full flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="font-medium">Delete Account</p>
                    <p className="text-sm text-muted-foreground">Request account and data deletion</p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </button>

              <div className="pt-4 border-t mt-6">
                <p className="text-sm text-muted-foreground">
                  Version 1.0.0
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  &copy; 2025 Fanz LLC. All rights reserved.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
