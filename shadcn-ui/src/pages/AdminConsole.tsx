import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Plug, Sliders, CreditCard, Save, Sparkles, Key, BarChart3, Palette, Search, UserCheck, UserX, Crown, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { adminApi, type PaymentProviderConfig, type ThemeSettings, type UserSummary, type SystemStats } from '@/lib/api/admin';

export default function AdminConsole() {
  const [userEmail, setUserEmail] = useState('');
  const [comped, setComped] = useState(false);
  const [activeSub, setActiveSub] = useState(false);
  const [plan, setPlan] = useState('pro-monthly');

  const [pttEnabled, setPttEnabled] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [loggingEnabled, setLoggingEnabled] = useState(true);
  const [savingAccess, setSavingAccess] = useState(false);
  const [savingToggles, setSavingToggles] = useState(false);

  const [providerConfigs, setProviderConfigs] = useState<Record<string, Record<string, string>>>({});
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [savingProvider, setSavingProvider] = useState<string | null>(null);

  // Theme settings
  const [theme, setTheme] = useState<ThemeSettings>({
    primary_color: '#6366f1',
    secondary_color: '#8b5cf6',
    accent_color: '#06b6d4',
    background_color: '#0a0a0f',
    font_family: 'Inter',
    border_radius: '0.75rem',
  });
  const [savingTheme, setSavingTheme] = useState(false);

  // User management
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userCount, setUserCount] = useState(0);
  const [editingUser, setEditingUser] = useState<UserSummary | null>(null);
  const [savingUser, setSavingUser] = useState(false);

  // Stats
  const [stats, setStats] = useState<SystemStats | null>(null);

  const providerTemplates = useMemo(
    () => ({
      ccbill: [
        { key: 'clientAccnum', label: 'Client Accnum' },
        { key: 'clientSubacc', label: 'Subaccount' },
        { key: 'formName', label: 'Form Name' },
        { key: 'salt', label: 'Salt/Signature Key' },
        { key: 'flexFormId', label: 'FlexForm ID (optional)' },
      ],
      segpay: [
        { key: 'merchantId', label: 'Merchant ID' },
        { key: 'pricePointId', label: 'Price Point / Package ID' },
        { key: 'apiKey', label: 'API Key / Signature' },
      ],
      epoch: [
        { key: 'piCode', label: 'PI Code' },
        { key: 'secretWord', label: 'Secret Word' },
      ],
      vendo: [
        { key: 'siteId', label: 'Site ID' },
        { key: 'secretKey', label: 'Signature Key' },
      ],
      verotel: [
        { key: 'shopId', label: 'Shop ID' },
        { key: 'signatureKey', label: 'Signature Key' },
      ],
      commercegate: [
        { key: 'merchantId', label: 'Merchant ID' },
        { key: 'apiSecret', label: 'API Secret' },
      ],
      paxum: [
        { key: 'accountEmail', label: 'Account Email' },
        { key: 'apiKey', label: 'API Key' },
      ],
      wise: [{ key: 'apiKey', label: 'API Key' }],
      dwolla: [
        { key: 'key', label: 'Key' },
        { key: 'secret', label: 'Secret' },
      ],
      crypto: [
        { key: 'btc', label: 'BTC Address' },
        { key: 'eth', label: 'ETH Address' },
        { key: 'usdt', label: 'USDT Address' },
        { key: 'usdc', label: 'USDC Address' },
      ],
      cosmo_pay: [{ key: 'token', label: 'Cosmo Pay Token' }],
      stripe: [
        { key: 'publishable_key', label: 'Publishable Key' },
        { key: 'secret_key', label: 'Secret Key' },
        { key: 'webhook_secret', label: 'Webhook Secret' },
      ],
      square: [
        { key: 'access_token', label: 'Access Token' },
        { key: 'location_id', label: 'Location ID' },
      ],
      sumup: [
        { key: 'api_key', label: 'API Key' },
        { key: 'merchant_code', label: 'Merchant Code' },
      ],
      godaddy: [
        { key: 'api_key', label: 'API Key' },
        { key: 'secret', label: 'Secret' },
      ],
      bankful: [
        { key: 'api_key', label: 'API Key' },
        { key: 'secret', label: 'Secret Key' },
      ],
      triplea: [
        { key: 'client_id', label: 'Client ID' },
        { key: 'api_key', label: 'API Key' },
        { key: 'merchant_key', label: 'Merchant Key' },
      ],
      nowpayments: [
        { key: 'api_key', label: 'API Key' },
        { key: 'public_key', label: 'Public Key' },
      ],
      paypal: [
        { key: 'client_id', label: 'Client ID' },
        { key: 'secret', label: 'Secret' },
      ],
    }),
    []
  );

  const providers = useMemo(
    () => [
      { id: 'ccbill', label: 'CCBill (Adult)' },
      { id: 'segpay', label: 'Segpay (Adult)' },
      { id: 'epoch', label: 'Epoch (Adult)' },
      { id: 'verotel', label: 'Verotel (Adult)' },
      { id: 'stripe', label: 'Stripe' },
      { id: 'square', label: 'Square' },
      { id: 'sumup', label: 'SumUp' },
      { id: 'godaddy', label: 'GoDaddy Payments' },
      { id: 'paypal', label: 'PayPal' },
      { id: 'bankful', label: 'Bankful' },
      { id: 'triplea', label: 'Triple-A (Crypto)' },
      { id: 'nowpayments', label: 'NowPayments (Crypto)' },
      { id: 'crypto', label: 'Direct Crypto' },
      { id: 'vendo', label: 'Vendo' },
      { id: 'commercegate', label: 'CommerceGate' },
      { id: 'paxum', label: 'Paxum (Payouts)' },
      { id: 'wise', label: 'Wise (Payouts)' },
      { id: 'dwolla', label: 'Dwolla' },
      { id: 'cosmo_pay', label: 'Cosmo Pay' },
    ],
    []
  );

  useEffect(() => {
    const loadProviders = async () => {
      setLoadingProviders(true);
      try {
        const data = await adminApi.listPaymentProviders();
        const mapped: Record<string, Record<string, string>> = {};
        data.forEach((p: PaymentProviderConfig) => {
          mapped[p.provider] = p.config || {};
        });
        setProviderConfigs(mapped);
      } catch (error) {
        // ignore if admin key missing
      } finally {
        setLoadingProviders(false);
      }
    };
    loadProviders();

    // Load theme settings
    const loadTheme = async () => {
      try {
        const themeData = await adminApi.getTheme();
        setTheme(themeData);
      } catch (error) {
        // Use defaults
      }
    };
    loadTheme();

    // Load stats
    const loadStats = async () => {
      try {
        const statsData = await adminApi.getStats();
        setStats(statsData);
      } catch (error) {
        // ignore
      }
    };
    loadStats();
  }, []);

  const loadUsers = async (search?: string) => {
    setLoadingUsers(true);
    try {
      const [usersData, countData] = await Promise.all([
        adminApi.listUsers({ limit: 50, search }),
        adminApi.getUserCount(search),
      ]);
      setUsers(usersData);
      setUserCount(countData.total);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSearchUsers = () => {
    loadUsers(userSearch || undefined);
  };

  const handleSaveTheme = async () => {
    setSavingTheme(true);
    try {
      await adminApi.updateTheme(theme);
      toast.success('Theme settings saved');
      // Apply theme to document
      document.documentElement.style.setProperty('--primary', theme.primary_color);
      document.documentElement.style.setProperty('--secondary', theme.secondary_color);
      document.documentElement.style.setProperty('--accent', theme.accent_color);
    } catch (error) {
      toast.error('Failed to save theme settings');
    } finally {
      setSavingTheme(false);
    }
  };

  const handleUpdateUser = async (userId: string, data: Partial<UserSummary>) => {
    setSavingUser(true);
    try {
      await adminApi.updateUser(userId, data);
      toast.success('User updated');
      setEditingUser(null);
      loadUsers(userSearch || undefined);
    } catch (error) {
      toast.error('Failed to update user');
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;
    try {
      await adminApi.deleteUser(userId);
      toast.success('User deactivated');
      loadUsers(userSearch || undefined);
    } catch (error) {
      toast.error('Failed to deactivate user');
    }
  };

  const saveAccess = async () => {
    if (!userEmail.trim()) {
      toast.error('Enter a user email');
      return;
    }
    setSavingAccess(true);
    try {
      await adminApi.updateUserAccess({
        email: userEmail.trim(),
        comped,
        active_subscription: activeSub,
        subscription_plan: plan,
      });
      toast.success('Access settings saved');
    } catch (error) {
      toast.error('Failed to save access settings');
    } finally {
      setSavingAccess(false);
    }
  };

  const saveToggles = async () => {
    setSavingToggles(true);
    try {
      await adminApi.updateFeatures({
        ptt_enabled: pttEnabled,
        ai_enabled: aiEnabled,
        logging_enabled: loggingEnabled,
      });
      toast.success('Feature toggles saved');
    } catch (error) {
      toast.error('Failed to save feature toggles');
    } finally {
      setSavingToggles(false);
    }
  };

  const handleProviderChange = (provider: string, key: string, value: string) => {
    setProviderConfigs((prev) => ({
      ...prev,
      [provider]: {
        ...(prev[provider] || {}),
        [key]: value,
      },
    }));
  };

  const saveProvider = async (provider: string) => {
    setSavingProvider(provider);
    try {
      await adminApi.savePaymentProvider(provider, providerConfigs[provider] || {});
      toast.success(`${provider} config saved`);
    } catch (error) {
      toast.error('Failed to save provider config (check admin API key)');
    } finally {
      setSavingProvider(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gradient">Admin Console</h1>
          <p className="text-muted-foreground">
            Full control over users, theme, billing, and system settings.
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="glass-panel p-3 text-center">
            <p className="text-2xl font-bold text-primary">{stats.total_users}</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </Card>
          <Card className="glass-panel p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{stats.subscribers}</p>
            <p className="text-xs text-muted-foreground">Subscribers</p>
          </Card>
          <Card className="glass-panel p-3 text-center">
            <p className="text-2xl font-bold text-blue-400">{stats.comped_users}</p>
            <p className="text-xs text-muted-foreground">Comped</p>
          </Card>
          <Card className="glass-panel p-3 text-center">
            <p className="text-2xl font-bold text-purple-400">{stats.total_contacts}</p>
            <p className="text-xs text-muted-foreground">Contacts</p>
          </Card>
          <Card className="glass-panel p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{stats.total_messages}</p>
            <p className="text-xs text-muted-foreground">Messages</p>
          </Card>
        </div>
      )}

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-2" />Users</TabsTrigger>
          <TabsTrigger value="theme"><Palette className="h-4 w-4 mr-2" />Theme</TabsTrigger>
          <TabsTrigger value="features"><Sliders className="h-4 w-4 mr-2" />Features</TabsTrigger>
          <TabsTrigger value="payments"><CreditCard className="h-4 w-4 mr-2" />Payments</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card className="glass-panel p-4">
            <div className="flex items-center gap-2 mb-4">
              <Input
                placeholder="Search by email or name..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
              />
              <Button onClick={handleSearchUsers} disabled={loadingUsers}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button variant="outline" onClick={() => loadUsers()} disabled={loadingUsers}>
                <RefreshCw className={`h-4 w-4 ${loadingUsers ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {loadingUsers ? (
              <p className="text-muted-foreground text-center py-8">Loading users...</p>
            ) : users.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No users found. Click Search or Refresh to load users.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-2">Showing {users.length} of {userCount} users</p>
                {users.map((user) => (
                  <Card key={user.id} className="p-3 flex items-center justify-between border-white/10">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{user.email}</p>
                        {user.comped && <Badge className="bg-blue-500/20 text-blue-400"><Crown className="h-3 w-3 mr-1" />Comped</Badge>}
                        {user.active_subscription && <Badge className="bg-green-500/20 text-green-400"><UserCheck className="h-3 w-3 mr-1" />Subscriber</Badge>}
                        {!user.is_active && <Badge className="bg-red-500/20 text-red-400"><UserX className="h-3 w-3 mr-1" />Inactive</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {user.full_name || 'No name'} • {user.role || 'user'} • Plan: {user.subscription_plan || 'none'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingUser(user)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {user.is_active && (
                        <Button size="sm" variant="outline" className="text-red-400" onClick={() => handleDeactivateUser(user.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>

          {/* Edit User Dialog (inline for simplicity) */}
          {editingUser && (
            <Card className="glass-panel p-4 border-primary/50">
              <h3 className="font-semibold mb-4">Edit User: {editingUser.email}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Role</Label>
                  <Input
                    value={editingUser.role || 'user'}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Subscription Plan</Label>
                  <Input
                    value={editingUser.subscription_plan || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, subscription_plan: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingUser.comped}
                    onCheckedChange={(v) => setEditingUser({ ...editingUser, comped: v })}
                  />
                  <Label>Comped (free access)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingUser.active_subscription}
                    onCheckedChange={(v) => setEditingUser({ ...editingUser, active_subscription: v })}
                  />
                  <Label>Active Subscription</Label>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={() => handleUpdateUser(editingUser.id, editingUser)} disabled={savingUser}>
                  {savingUser ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
              </div>
            </Card>
          )}

          {/* Quick Access Form */}
          <Card className="glass-panel p-4">
            <h3 className="font-semibold mb-3">Quick Access by Email</h3>
            <div className="space-y-3">
              <Input
                placeholder="user@example.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={comped} onCheckedChange={setComped} />
                  <Label>Comped</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={activeSub} onCheckedChange={setActiveSub} />
                  <Label>Active Sub</Label>
                </div>
                <Input
                  className="w-32"
                  placeholder="Plan"
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                />
              </div>
              <Button className="gradient-primary" onClick={saveAccess} disabled={savingAccess}>
                {savingAccess ? 'Saving...' : 'Update Access'}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Theme Tab */}
        <TabsContent value="theme" className="space-y-4">
          <Card className="glass-panel p-4">
            <h3 className="font-semibold mb-4">Theme Customization</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label>Primary Color</Label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="color"
                    value={theme.primary_color}
                    onChange={(e) => setTheme({ ...theme, primary_color: e.target.value })}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={theme.primary_color}
                    onChange={(e) => setTheme({ ...theme, primary_color: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Secondary Color</Label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="color"
                    value={theme.secondary_color}
                    onChange={(e) => setTheme({ ...theme, secondary_color: e.target.value })}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={theme.secondary_color}
                    onChange={(e) => setTheme({ ...theme, secondary_color: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Accent Color</Label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="color"
                    value={theme.accent_color}
                    onChange={(e) => setTheme({ ...theme, accent_color: e.target.value })}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={theme.accent_color}
                    onChange={(e) => setTheme({ ...theme, accent_color: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Background Color</Label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="color"
                    value={theme.background_color}
                    onChange={(e) => setTheme({ ...theme, background_color: e.target.value })}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={theme.background_color}
                    onChange={(e) => setTheme({ ...theme, background_color: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Font Family</Label>
                <Input
                  value={theme.font_family}
                  onChange={(e) => setTheme({ ...theme, font_family: e.target.value })}
                  className="mt-1"
                  placeholder="Inter, sans-serif"
                />
              </div>
              <div>
                <Label>Border Radius</Label>
                <Input
                  value={theme.border_radius}
                  onChange={(e) => setTheme({ ...theme, border_radius: e.target.value })}
                  className="mt-1"
                  placeholder="0.75rem"
                />
              </div>
            </div>
            <div className="mt-4">
              <Label>Logo URL</Label>
              <Input
                value={theme.logo_url || ''}
                onChange={(e) => setTheme({ ...theme, logo_url: e.target.value })}
                className="mt-1"
                placeholder="https://example.com/logo.png"
              />
            </div>
            <Button className="gradient-primary mt-4" onClick={handleSaveTheme} disabled={savingTheme}>
              <Save className="h-4 w-4 mr-2" />
              {savingTheme ? 'Saving...' : 'Save Theme'}
            </Button>
          </Card>

          {/* Preview */}
          <Card className="glass-panel p-4">
            <h3 className="font-semibold mb-4">Preview</h3>
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-lg" style={{ backgroundColor: theme.primary_color }} />
              <div className="w-16 h-16 rounded-lg" style={{ backgroundColor: theme.secondary_color }} />
              <div className="w-16 h-16 rounded-lg" style={{ backgroundColor: theme.accent_color }} />
              <div className="w-16 h-16 rounded-lg border" style={{ backgroundColor: theme.background_color }} />
            </div>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-4">
          <Card className="glass-panel p-4">
            <h3 className="font-semibold mb-4">Feature Toggles</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">PTT / CB voice</p>
                  <p className="text-sm text-muted-foreground">Enable LiveKit-based push-to-talk</p>
                </div>
                <Switch checked={pttEnabled} onCheckedChange={setPttEnabled} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">AI features</p>
                  <p className="text-sm text-muted-foreground">Summaries, STT, auto-replies</p>
                </div>
                <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Audit logging</p>
                  <p className="text-sm text-muted-foreground">Log admin actions and events</p>
                </div>
                <Switch checked={loggingEnabled} onCheckedChange={setLoggingEnabled} />
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={saveToggles} disabled={savingToggles}>
              {savingToggles ? 'Saving...' : 'Save Feature Toggles'}
            </Button>
          </Card>

          <Card className="glass-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Built-in AI APIs</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                <p className="font-medium text-green-400">Groq (Llama 3.3)</p>
                <p className="text-xs text-muted-foreground">Fast & cheap</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                <p className="font-medium text-green-400">OpenAI (GPT-4)</p>
                <p className="text-xs text-muted-foreground">Premium quality</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                <p className="font-medium text-green-400">Google (Gemini)</p>
                <p className="text-xs text-muted-foreground">Multimodal</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                <p className="font-medium text-green-400">HuggingFace</p>
                <p className="text-xs text-muted-foreground">Open source</p>
              </div>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30 mt-3">
              <p className="text-sm text-blue-400">
                <Key className="inline h-4 w-4 mr-1" />
                API keys stored in: <code className="bg-black/30 px-1 rounded">/var/www/crm-escort-ai/backend/.env</code>
              </p>
            </div>
          </Card>

          <Card className="glass-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <Plug className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Integrations</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">PTT: LiveKit</Badge>
              <Badge variant="secondary">LiveKit: {import.meta.env.VITE_LIVEKIT_URL || 'not set'}</Badge>
              <Badge variant="secondary">API: {import.meta.env.VITE_API_BASE_URL || 'not set'}</Badge>
            </div>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card className="glass-panel p-4">
            <h3 className="font-semibold mb-3">Payment Processors</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enter credentials for each provider. Ensure VITE_ADMIN_API_KEY is set.
            </p>
            {loadingProviders ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {providers.map((p) => {
                  const fields = providerTemplates[p.id as keyof typeof providerTemplates] || [];
                  return (
                    <Card key={p.id} className="p-4 space-y-3 border-white/10">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{p.label}</h4>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => saveProvider(p.id)}
                          disabled={savingProvider === p.id}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          {savingProvider === p.id ? 'Saving…' : 'Save'}
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {fields.map((f) => (
                          <div key={f.key}>
                            <Label className="text-xs">{f.label}</Label>
                            <Input
                              type="text"
                              placeholder={f.label}
                              value={providerConfigs[p.id]?.[f.key] || ''}
                              onChange={(e) => handleProviderChange(p.id, f.key, e.target.value)}
                            />
                          </div>
                        ))}
                        {fields.length === 0 && (
                          <p className="text-xs text-muted-foreground">No fields defined.</p>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
