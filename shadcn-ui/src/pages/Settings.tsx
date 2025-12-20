import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Key, Bell, Shield, Palette, Accessibility, FileText, ExternalLink, DollarSign, Loader2, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { billingApi, FeeConfig } from '@/lib/api/billing';
import { toast } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

export default function Settings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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

  // Get active tab from URL parameter or default to 'profile'
  const activeTab = searchParams.get('tab') || 'profile';

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

  const [fees, setFees] = useState<Record<string, FeeConfig>>({});
  const [feesLoading, setFeesLoading] = useState(false);
  const [savingFee, setSavingFee] = useState<string | null>(null);
  const [newFeeType, setNewFeeType] = useState('');
  const [showAddFee, setShowAddFee] = useState(false);

  useEffect(() => {
    loadFees();
  }, []);

  const loadFees = async () => {
    setFeesLoading(true);
    try {
      const data = await billingApi.getFees();
      setFees(data.fees);
    } catch (error) {
      // Fees endpoint may not be available yet
      console.error('Failed to load fees:', error);
    } finally {
      setFeesLoading(false);
    }
  };

  const handleFeeChange = (type: string, field: 'percent' | 'flat_cents', value: string) => {
    const numValue = field === 'percent' ? parseFloat(value) || 0 : parseInt(value) || 0;
    setFees((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: numValue,
      },
    }));
  };

  const handleSaveFee = async (type: string) => {
    setSavingFee(type);
    try {
      await billingApi.updateFee(type, fees[type].percent, fees[type].flat_cents);
      toast.success(`${type} fee updated`);
    } catch (error) {
      toast.error('Failed to update fee');
    } finally {
      setSavingFee(null);
    }
  };

  const handleCreateFee = async () => {
    if (!newFeeType.trim()) {
      toast.error('Please enter a transaction type name');
      return;
    }
    const typeName = newFeeType.trim().toLowerCase().replace(/\s+/g, '_');
    try {
      await billingApi.createFee(typeName, 0, 0);
      toast.success(`Created fee type: ${typeName}`);
      setNewFeeType('');
      setShowAddFee(false);
      loadFees();
    } catch (error) {
      toast.error('Failed to create fee type');
    }
  };

  const handleDeleteFee = async (type: string) => {
    if (!confirm(`Delete fee type "${type}"?`)) return;
    try {
      await billingApi.deleteFee(type);
      toast.success(`Deleted fee type: ${type}`);
      loadFees();
    } catch (error) {
      toast.error('Failed to delete fee type');
    }
  };

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

      <Tabs value={activeTab} onValueChange={(value) => navigate(`/settings?tab=${value}`)} className="space-y-6">
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
          <TabsTrigger value="billing">
            <DollarSign className="h-4 w-4 mr-2" />
            Platform Fees
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

        {/* Billing / Platform Fees Tab */}
        <TabsContent value="billing">
          <Card className="glass-panel p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold">Platform Fees</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddFee(!showAddFee)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Fee Type
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Set fees charged to end consumers (not content creators). Each transaction type can have a percentage fee and/or a flat fee.
            </p>

            {showAddFee && (
              <div className="p-4 rounded-lg border bg-primary/5 mb-6">
                <h3 className="font-semibold mb-3">Create New Fee Type</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., live_stream, video_call"
                    value={newFeeType}
                    onChange={(e) => setNewFeeType(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleCreateFee}>Create</Button>
                  <Button variant="outline" onClick={() => setShowAddFee(false)}>Cancel</Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Use lowercase with underscores (e.g., video_call, live_stream)
                </p>
              </div>
            )}

            {feesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : Object.keys(fees).length === 0 ? (
              <p className="text-muted-foreground py-4">No fee configurations found. The backend may not be running.</p>
            ) : (
              <div className="space-y-6">
                {Object.entries(fees).map(([type, config]) => (
                  <div key={type} className="p-4 rounded-lg border bg-muted/20">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold capitalize">{type.replace(/_/g, ' ')}</h3>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveFee(type)}
                          disabled={savingFee === type}
                        >
                          {savingFee === type ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Save'
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteFee(type)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`${type}-percent`}>Percentage Fee (%)</Label>
                        <Input
                          id={`${type}-percent`}
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={config.percent}
                          onChange={(e) => handleFeeChange(type, 'percent', e.target.value)}
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          e.g., 10 = 10% of transaction
                        </p>
                      </div>
                      <div>
                        <Label htmlFor={`${type}-flat`}>Flat Fee (cents)</Label>
                        <Input
                          id={`${type}-flat`}
                          type="number"
                          step="1"
                          min="0"
                          value={config.flat_cents}
                          onChange={(e) => handleFeeChange(type, 'flat_cents', e.target.value)}
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          e.g., 99 = $0.99 flat fee
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      Consumer pays: <span className="font-medium">subtotal + {config.percent}% + ${(config.flat_cents / 100).toFixed(2)}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
