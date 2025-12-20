import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Shield,
  Users,
  Plug,
  Sliders,
  CreditCard,
  Save,
  Sparkles,
  Key,
  BarChart3,
  Palette,
  Search,
  UserCheck,
  UserX,
  Crown,
  Edit2,
  Trash2,
  RefreshCw,
  Settings2,
  Upload,
  X,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { adminApi, type PaymentProviderConfig, type ThemeSettings, type UserSummary, type SystemStats } from '@/lib/api/admin';
import { useAuth } from '@/lib/hooks/useAuth';

interface SystemSettings {
  max_users?: number;
  rate_limit_requests?: number;
  rate_limit_window?: number;
  maintenance_mode: boolean;
  signup_enabled: boolean;
}

export default function Admin() {
  const { user } = useAuth();

  // User management state
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userCount, setUserCount] = useState(0);
  const [editingUser, setEditingUser] = useState<UserSummary | null>(null);
  const [savingUser, setSavingUser] = useState(false);

  // Quick access form
  const [userEmail, setUserEmail] = useState('');
  const [comped, setComped] = useState(false);
  const [activeSub, setActiveSub] = useState(false);
  const [plan, setPlan] = useState('pro-monthly');
  const [savingAccess, setSavingAccess] = useState(false);

  // Theme settings
  const [theme, setTheme] = useState<ThemeSettings>({
    primary_color: '#6366f1',
    secondary_color: '#8b5cf6',
    accent_color: '#06b6d4',
    background_color: '#0a0a0f',
    font_family: 'Inter',
    border_radius: '0.75rem',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [savingTheme, setSavingTheme] = useState(false);

  // Payment processors
  const [providerConfigs, setProviderConfigs] = useState<Record<string, Record<string, string>>>({});
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [savingProvider, setSavingProvider] = useState<string | null>(null);

  // Feature flags
  const [pttEnabled, setPttEnabled] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [loggingEnabled, setLoggingEnabled] = useState(true);
  const [savingToggles, setSavingToggles] = useState(false);

  // System settings
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    max_users: undefined,
    rate_limit_requests: 100,
    rate_limit_window: 60,
    maintenance_mode: false,
    signup_enabled: true,
  });
  const [savingSystem, setSavingSystem] = useState(false);

  // Stats
  const [stats, setStats] = useState<SystemStats | null>(null);

  const providerTemplates = useMemo(
    () => ({
      ccbill: [
        { key: 'clientAccnum', label: 'Client Accnum', placeholder: '900000' },
        { key: 'clientSubacc', label: 'Subaccount', placeholder: '0000' },
        { key: 'formName', label: 'Form Name', placeholder: 'cc' },
        { key: 'salt', label: 'Salt/Signature Key', placeholder: 'Your salt key' },
        { key: 'flexFormId', label: 'FlexForm ID (optional)', placeholder: '' },
      ],
      segpay: [
        { key: 'merchantId', label: 'Merchant ID', placeholder: 'Your merchant ID' },
        { key: 'pricePointId', label: 'Price Point / Package ID', placeholder: 'Package ID' },
        { key: 'apiKey', label: 'API Key / Signature', placeholder: 'API key' },
      ],
      epoch: [
        { key: 'piCode', label: 'PI Code', placeholder: 'Your PI code' },
        { key: 'secretWord', label: 'Secret Word', placeholder: 'Secret word' },
      ],
      vendo: [
        { key: 'siteId', label: 'Site ID', placeholder: 'Site ID' },
        { key: 'secretKey', label: 'Signature Key', placeholder: 'Secret key' },
      ],
      verotel: [
        { key: 'shopId', label: 'Shop ID', placeholder: 'Shop ID' },
        { key: 'signatureKey', label: 'Signature Key', placeholder: 'Signature key' },
      ],
      commercegate: [
        { key: 'merchantId', label: 'Merchant ID', placeholder: 'Merchant ID' },
        { key: 'apiSecret', label: 'API Secret', placeholder: 'API secret' },
      ],
      paxum: [
        { key: 'accountEmail', label: 'Account Email', placeholder: 'account@example.com' },
        { key: 'apiKey', label: 'API Key', placeholder: 'API key' },
      ],
      wise: [{ key: 'apiKey', label: 'API Key', placeholder: 'Wise API key' }],
      dwolla: [
        { key: 'key', label: 'Key', placeholder: 'Dwolla key' },
        { key: 'secret', label: 'Secret', placeholder: 'Dwolla secret' },
      ],
      crypto: [
        { key: 'btc', label: 'BTC Address', placeholder: 'Bitcoin wallet address' },
        { key: 'eth', label: 'ETH Address', placeholder: 'Ethereum wallet address' },
        { key: 'usdt', label: 'USDT Address', placeholder: 'Tether wallet address' },
        { key: 'usdc', label: 'USDC Address', placeholder: 'USDC wallet address' },
      ],
      cosmo_pay: [{ key: 'token', label: 'Cosmo Pay Token', placeholder: 'Token' }],
      stripe: [
        { key: 'publishable_key', label: 'Publishable Key', placeholder: 'pk_live_...' },
        { key: 'secret_key', label: 'Secret Key', placeholder: 'sk_live_...' },
        { key: 'webhook_secret', label: 'Webhook Secret', placeholder: 'whsec_...' },
      ],
      square: [
        { key: 'access_token', label: 'Access Token', placeholder: 'Access token' },
        { key: 'location_id', label: 'Location ID', placeholder: 'Location ID' },
      ],
      sumup: [
        { key: 'api_key', label: 'API Key', placeholder: 'API key' },
        { key: 'merchant_code', label: 'Merchant Code', placeholder: 'Merchant code' },
      ],
      godaddy: [
        { key: 'api_key', label: 'API Key', placeholder: 'API key' },
        { key: 'secret', label: 'Secret', placeholder: 'Secret' },
      ],
      bankful: [
        { key: 'api_key', label: 'API Key', placeholder: 'API key' },
        { key: 'secret', label: 'Secret Key', placeholder: 'Secret' },
      ],
      triplea: [
        { key: 'client_id', label: 'Client ID', placeholder: 'Client ID' },
        { key: 'api_key', label: 'API Key', placeholder: 'API key' },
        { key: 'merchant_key', label: 'Merchant Key', placeholder: 'Merchant key' },
      ],
      nowpayments: [
        { key: 'api_key', label: 'API Key', placeholder: 'API key' },
        { key: 'public_key', label: 'Public Key', placeholder: 'Public key' },
      ],
      paypal: [
        { key: 'client_id', label: 'Client ID', placeholder: 'Client ID' },
        { key: 'secret', label: 'Secret', placeholder: 'Secret' },
      ],
    }),
    []
  );

  const providers = useMemo(
    () => [
      { id: 'ccbill', label: 'CCBill (Adult)', category: 'Adult' },
      { id: 'segpay', label: 'Segpay (Adult)', category: 'Adult' },
      { id: 'epoch', label: 'Epoch (Adult)', category: 'Adult' },
      { id: 'verotel', label: 'Verotel (Adult)', category: 'Adult' },
      { id: 'vendo', label: 'Vendo', category: 'Adult' },
      { id: 'commercegate', label: 'CommerceGate', category: 'Adult' },
      { id: 'stripe', label: 'Stripe', category: 'Standard' },
      { id: 'square', label: 'Square', category: 'Standard' },
      { id: 'sumup', label: 'SumUp', category: 'Standard' },
      { id: 'godaddy', label: 'GoDaddy Payments', category: 'Standard' },
      { id: 'paypal', label: 'PayPal', category: 'Standard' },
      { id: 'bankful', label: 'Bankful', category: 'Banking' },
      { id: 'triplea', label: 'Triple-A (Crypto)', category: 'Crypto' },
      { id: 'nowpayments', label: 'NowPayments (Crypto)', category: 'Crypto' },
      { id: 'crypto', label: 'Direct Crypto', category: 'Crypto' },
      { id: 'paxum', label: 'Paxum (Payouts)', category: 'Payouts' },
      { id: 'wise', label: 'Wise (Payouts)', category: 'Payouts' },
      { id: 'dwolla', label: 'Dwolla', category: 'Banking' },
      { id: 'cosmo_pay', label: 'Cosmo Pay', category: 'Adult' },
    ],
    []
  );

  useEffect(() => {
    const loadData = async () => {
      // Load payment providers
      setLoadingProviders(true);
      try {
        const data = await adminApi.listPaymentProviders();
        const mapped: Record<string, Record<string, string>> = {};
        data.forEach((p: PaymentProviderConfig) => {
          mapped[p.provider] = p.config || {};
        });
        setProviderConfigs(mapped);
      } catch (error) {
        console.error('Failed to load providers:', error);
      } finally {
        setLoadingProviders(false);
      }

      // Load theme settings
      try {
        const themeData = await adminApi.getTheme();
        setTheme(themeData);
      } catch (error) {
        console.error('Failed to load theme:', error);
      }

      // Load stats
      try {
        const statsData = await adminApi.getStats();
        setStats(statsData);
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    };
    loadData();
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
      toast.success('Theme settings saved successfully');

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
      toast.success('User updated successfully');
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
      setUserEmail('');
      setComped(false);
      setActiveSub(false);
      setPlan('pro-monthly');
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
      toast.success(`${provider} configuration saved`);
    } catch (error) {
      toast.error('Failed to save provider config');
    } finally {
      setSavingProvider(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gradient bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              Admin Panel
            </h1>
            <p className="text-muted-foreground">
              Complete control over WickedCRM - Users, Theme, Payments & System
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          Logged in as {user?.email}
        </Badge>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="glass-panel border-white/10">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-primary mr-2" />
              </div>
              <p className="text-2xl font-bold text-primary">{stats.total_users}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card className="glass-panel border-white/10">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-400 mr-2" />
              </div>
              <p className="text-2xl font-bold text-green-400">{stats.subscribers}</p>
              <p className="text-xs text-muted-foreground">Active Subscribers</p>
            </CardContent>
          </Card>
          <Card className="glass-panel border-white/10">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Crown className="h-5 w-5 text-blue-400 mr-2" />
              </div>
              <p className="text-2xl font-bold text-blue-400">{stats.comped_users}</p>
              <p className="text-xs text-muted-foreground">Comped</p>
            </CardContent>
          </Card>
          <Card className="glass-panel border-white/10">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-purple-400 mr-2" />
              </div>
              <p className="text-2xl font-bold text-purple-400">{stats.total_contacts}</p>
              <p className="text-xs text-muted-foreground">Total Contacts</p>
            </CardContent>
          </Card>
          <Card className="glass-panel border-white/10">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-amber-400 mr-2" />
              </div>
              <p className="text-2xl font-bold text-amber-400">{stats.total_messages}</p>
              <p className="text-xs text-muted-foreground">Messages Sent</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Admin Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-card/50 backdrop-blur-sm">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="theme" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Theme</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Sliders className="h-4 w-4" />
            <span className="hidden sm:inline">Features</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">System</span>
          </TabsTrigger>
        </TabsList>

        {/* USERS TAB */}
        <TabsContent value="users" className="space-y-4 mt-6">
          {/* Search & Filter */}
          <Card className="glass-panel border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>Search, edit, and manage user accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search by email or name..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                  className="flex-1"
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
                <div className="text-center py-12 text-muted-foreground">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                  Loading users...
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No users found. Click Search or Refresh to load users.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-3">
                    Showing {users.length} of {userCount} total users
                  </p>
                  {users.map((user) => (
                    <Card key={user.id} className="p-4 border-white/10 hover:border-primary/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-lg">{user.email}</p>
                            {user.comped && (
                              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                <Crown className="h-3 w-3 mr-1" />
                                Comped
                              </Badge>
                            )}
                            {user.active_subscription && (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                <UserCheck className="h-3 w-3 mr-1" />
                                Subscriber
                              </Badge>
                            )}
                            {!user.is_active && (
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                                <UserX className="h-3 w-3 mr-1" />
                                Inactive
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.full_name || 'No name set'} • Role: {user.role || 'user'} • Plan:{' '}
                            {user.subscription_plan || 'none'}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingUser(user)}
                            className="hover:border-primary"
                          >
                            <Edit2 className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          {user.is_active && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-400 hover:border-red-400"
                              onClick={() => handleDeactivateUser(user.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit User Modal */}
          {editingUser && (
            <Card className="glass-panel border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Edit User: {editingUser.email}</span>
                  <Button variant="ghost" size="sm" onClick={() => setEditingUser(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label>Role</Label>
                    <Select
                      value={editingUser.role || 'user'}
                      onValueChange={(v) => setEditingUser({ ...editingUser, role: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Subscription Plan</Label>
                    <Input
                      value={editingUser.subscription_plan || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, subscription_plan: e.target.value })}
                      placeholder="e.g., pro-monthly"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-white/10">
                    <Switch
                      checked={editingUser.comped}
                      onCheckedChange={(v) => setEditingUser({ ...editingUser, comped: v })}
                    />
                    <Label>Comped (Free Access)</Label>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-white/10">
                    <Switch
                      checked={editingUser.active_subscription}
                      onCheckedChange={(v) => setEditingUser({ ...editingUser, active_subscription: v })}
                    />
                    <Label>Active Subscription</Label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleUpdateUser(editingUser.id, editingUser)}
                    disabled={savingUser}
                    className="flex-1"
                  >
                    {savingUser ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="outline" onClick={() => setEditingUser(null)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Access Form */}
          <Card className="glass-panel border-white/10">
            <CardHeader>
              <CardTitle>Quick Access by Email</CardTitle>
              <CardDescription>Grant or modify access for a specific user by email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="user@example.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={comped} onCheckedChange={setComped} />
                  <Label>Comped</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={activeSub} onCheckedChange={setActiveSub} />
                  <Label>Active Sub</Label>
                </div>
                <div className="col-span-2">
                  <Label>Plan</Label>
                  <Input
                    placeholder="e.g., pro-monthly"
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                  />
                </div>
              </div>
              <Button className="w-full gradient-primary" onClick={saveAccess} disabled={savingAccess}>
                {savingAccess ? 'Updating...' : 'Update Access'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* THEME TAB */}
        <TabsContent value="theme" className="space-y-4 mt-6">
          <Card className="glass-panel border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme Customization
              </CardTitle>
              <CardDescription>Customize colors, fonts, and branding for your CRM</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Color Pickers */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Primary Color</Label>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="color"
                      value={theme.primary_color}
                      onChange={(e) => setTheme({ ...theme, primary_color: e.target.value })}
                      className="w-14 h-10 rounded border border-white/20 cursor-pointer"
                    />
                    <Input
                      value={theme.primary_color}
                      onChange={(e) => setTheme({ ...theme, primary_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>Secondary Color</Label>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="color"
                      value={theme.secondary_color}
                      onChange={(e) => setTheme({ ...theme, secondary_color: e.target.value })}
                      className="w-14 h-10 rounded border border-white/20 cursor-pointer"
                    />
                    <Input
                      value={theme.secondary_color}
                      onChange={(e) => setTheme({ ...theme, secondary_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>Accent Color</Label>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="color"
                      value={theme.accent_color}
                      onChange={(e) => setTheme({ ...theme, accent_color: e.target.value })}
                      className="w-14 h-10 rounded border border-white/20 cursor-pointer"
                    />
                    <Input
                      value={theme.accent_color}
                      onChange={(e) => setTheme({ ...theme, accent_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>Background Color</Label>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="color"
                      value={theme.background_color}
                      onChange={(e) => setTheme({ ...theme, background_color: e.target.value })}
                      className="w-14 h-10 rounded border border-white/20 cursor-pointer"
                    />
                    <Input
                      value={theme.background_color}
                      onChange={(e) => setTheme({ ...theme, background_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Typography & Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Font Family</Label>
                  <Select value={theme.font_family} onValueChange={(v) => setTheme({ ...theme, font_family: v })}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                      <SelectItem value="Poppins">Poppins</SelectItem>
                      <SelectItem value="Montserrat">Montserrat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Border Radius</Label>
                  <Input
                    value={theme.border_radius}
                    onChange={(e) => setTheme({ ...theme, border_radius: e.target.value })}
                    className="mt-2"
                    placeholder="0.75rem"
                  />
                </div>
              </div>

              <Separator />

              {/* Logo Upload */}
              <div>
                <Label>Logo URL</Label>
                <Input
                  value={theme.logo_url || ''}
                  onChange={(e) => setTheme({ ...theme, logo_url: e.target.value })}
                  className="mt-2"
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-muted-foreground mt-1">Or upload a logo file (coming soon)</p>
              </div>

              <Button className="w-full gradient-primary" onClick={handleSaveTheme} disabled={savingTheme}>
                <Save className="h-4 w-4 mr-2" />
                {savingTheme ? 'Saving Theme...' : 'Save Theme Settings'}
              </Button>
            </CardContent>
          </Card>

          {/* Theme Preview */}
          <Card className="glass-panel border-white/10">
            <CardHeader>
              <CardTitle>Color Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[150px]">
                  <p className="text-xs text-muted-foreground mb-2">Primary</p>
                  <div className="h-20 rounded-lg border border-white/20" style={{ backgroundColor: theme.primary_color }} />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <p className="text-xs text-muted-foreground mb-2">Secondary</p>
                  <div className="h-20 rounded-lg border border-white/20" style={{ backgroundColor: theme.secondary_color }} />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <p className="text-xs text-muted-foreground mb-2">Accent</p>
                  <div className="h-20 rounded-lg border border-white/20" style={{ backgroundColor: theme.accent_color }} />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <p className="text-xs text-muted-foreground mb-2">Background</p>
                  <div className="h-20 rounded-lg border border-white/20" style={{ backgroundColor: theme.background_color }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAYMENTS TAB */}
        <TabsContent value="payments" className="space-y-4 mt-6">
          <Card className="glass-panel border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Processor Management
              </CardTitle>
              <CardDescription>
                Configure API credentials for all supported payment processors
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingProviders ? (
                <div className="text-center py-12 text-muted-foreground">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                  Loading processors...
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Group processors by category */}
                  {['Standard', 'Adult', 'Crypto', 'Banking', 'Payouts'].map((category) => {
                    const categoryProviders = providers.filter((p) => p.category === category);
                    if (categoryProviders.length === 0) return null;

                    return (
                      <div key={category}>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Badge variant="outline">{category}</Badge>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {categoryProviders.map((p) => {
                            const fields = providerTemplates[p.id as keyof typeof providerTemplates] || [];
                            const isConfigured = providerConfigs[p.id] && Object.keys(providerConfigs[p.id]).length > 0;

                            return (
                              <Card key={p.id} className="p-4 border-white/10 hover:border-primary/30 transition-colors">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold">{p.label}</h4>
                                    {isConfigured && (
                                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => saveProvider(p.id)}
                                    disabled={savingProvider === p.id}
                                  >
                                    <Save className="h-4 w-4 mr-1" />
                                    {savingProvider === p.id ? 'Saving...' : 'Save'}
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  {fields.map((f) => (
                                    <div key={f.key}>
                                      <Label className="text-xs">{f.label}</Label>
                                      <Input
                                        type="text"
                                        placeholder={f.placeholder}
                                        value={providerConfigs[p.id]?.[f.key] || ''}
                                        onChange={(e) => handleProviderChange(p.id, f.key, e.target.value)}
                                        className="mt-1"
                                      />
                                    </div>
                                  ))}
                                  {fields.length === 0 && (
                                    <p className="text-xs text-muted-foreground italic">No configuration needed</p>
                                  )}
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* FEATURES TAB */}
        <TabsContent value="features" className="space-y-4 mt-6">
          <Card className="glass-panel border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="h-5 w-5" />
                Feature Toggles
              </CardTitle>
              <CardDescription>Enable or disable platform features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-white/10 hover:border-primary/30 transition-colors">
                <div>
                  <p className="font-medium">Push-to-Talk / CB Voice</p>
                  <p className="text-sm text-muted-foreground">LiveKit-powered voice communication</p>
                </div>
                <Switch checked={pttEnabled} onCheckedChange={setPttEnabled} />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border border-white/10 hover:border-primary/30 transition-colors">
                <div>
                  <p className="font-medium">AI Features</p>
                  <p className="text-sm text-muted-foreground">Summaries, STT, auto-replies, and AI assistant</p>
                </div>
                <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border border-white/10 hover:border-primary/30 transition-colors">
                <div>
                  <p className="font-medium">Audit Logging</p>
                  <p className="text-sm text-muted-foreground">Log admin actions and system events</p>
                </div>
                <Switch checked={loggingEnabled} onCheckedChange={setLoggingEnabled} />
              </div>
              <Button className="w-full" variant="outline" onClick={saveToggles} disabled={savingToggles}>
                {savingToggles ? 'Saving...' : 'Save Feature Toggles'}
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Integrated AI APIs
              </CardTitle>
              <CardDescription>Built-in AI providers (configured server-side)</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* SYSTEM TAB */}
        <TabsContent value="system" className="space-y-4 mt-6">
          <Card className="glass-panel border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                System Settings
              </CardTitle>
              <CardDescription>Configure rate limits, maintenance mode, and system-wide settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Max Users (Optional)</Label>
                  <Input
                    type="number"
                    value={systemSettings.max_users || ''}
                    onChange={(e) =>
                      setSystemSettings({ ...systemSettings, max_users: e.target.value ? parseInt(e.target.value) : undefined })
                    }
                    placeholder="Unlimited"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Rate Limit (requests/window)</Label>
                  <Input
                    type="number"
                    value={systemSettings.rate_limit_requests || ''}
                    onChange={(e) =>
                      setSystemSettings({ ...systemSettings, rate_limit_requests: parseInt(e.target.value) || 100 })
                    }
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Rate Limit Window (seconds)</Label>
                  <Input
                    type="number"
                    value={systemSettings.rate_limit_window || ''}
                    onChange={(e) =>
                      setSystemSettings({ ...systemSettings, rate_limit_window: parseInt(e.target.value) || 60 })
                    }
                    className="mt-2"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-white/10">
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      Maintenance Mode
                    </p>
                    <p className="text-sm text-muted-foreground">Disable access for all non-admin users</p>
                  </div>
                  <Switch
                    checked={systemSettings.maintenance_mode}
                    onCheckedChange={(v) => setSystemSettings({ ...systemSettings, maintenance_mode: v })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-white/10">
                  <div>
                    <p className="font-medium">User Signups</p>
                    <p className="text-sm text-muted-foreground">Allow new user registrations</p>
                  </div>
                  <Switch
                    checked={systemSettings.signup_enabled}
                    onCheckedChange={(v) => setSystemSettings({ ...systemSettings, signup_enabled: v })}
                  />
                </div>
              </div>

              <Button className="w-full gradient-primary" onClick={() => toast.info('System settings saved (feature in progress)')}>
                <Save className="h-4 w-4 mr-2" />
                Save System Settings
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Platform Integrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">PTT: LiveKit</Badge>
                <Badge variant="secondary">LiveKit URL: {import.meta.env.VITE_LIVEKIT_URL || 'not set'}</Badge>
                <Badge variant="secondary">API: {import.meta.env.VITE_API_BASE_URL || 'not set'}</Badge>
                <Badge variant="secondary">Environment: {import.meta.env.MODE}</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
