import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Shield, Users, Plug, Sliders } from 'lucide-react';
import { adminApi } from '@/lib/api/admin';

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gradient">Admin Console</h1>
          <p className="text-muted-foreground">
            Control access, billing flags, and feature toggles. Requires VITE_ADMIN_API_KEY (X-Admin-Key) to reach admin APIs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass-panel p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">User Access & Billing Flags</h3>
          </div>
          <div className="space-y-3">
            <div>
              <Label htmlFor="userEmail">User email</Label>
              <Input
                id="userEmail"
                placeholder="user@example.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Comped (no billing)</p>
                <p className="text-sm text-muted-foreground">Grant free access without subscription</p>
              </div>
              <Switch checked={comped} onCheckedChange={setComped} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Active subscription</p>
                <p className="text-sm text-muted-foreground">Mark as paid subscriber</p>
              </div>
              <Switch checked={activeSub} onCheckedChange={setActiveSub} />
            </div>
            <div>
              <Label htmlFor="plan">Plan</Label>
              <Input
                id="plan"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Example: pro-monthly</p>
            </div>
            <Button className="gradient-primary w-full" onClick={saveAccess} disabled={savingAccess}>
              {savingAccess ? 'Saving...' : 'Save access flags'}
            </Button>
          </div>
        </Card>

        <Card className="glass-panel p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Feature Toggles</h3>
          </div>
          <div className="space-y-3">
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
            <Button variant="outline" className="w-full" onClick={saveToggles} disabled={savingToggles}>
              {savingToggles ? 'Saving...' : 'Save feature toggles'}
            </Button>
          </div>
        </Card>
      </div>

      <Card className="glass-panel p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Plug className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Integrations Snapshot</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage connectors (Telnyx, WhatsApp, Telegram, Email) from the Integrations page. Admin panel wiring can be added to control tokens and webhooks.
        </p>
        <Separator />
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">PTT: LiveKit</Badge>
          <Badge variant="secondary">WS: {import.meta.env.VITE_WS_URL || 'not set'}</Badge>
          <Badge variant="secondary">API: {import.meta.env.VITE_API_BASE_URL || 'not set'}</Badge>
        </div>
      </Card>
    </div>
  );
}
