import { useState, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { authApi } from '@/lib/api/auth';
import { useAuth } from '@/lib/hooks/useAuth';

export default function DeleteAccount() {
  const { user, isAuthenticated, clearAuth } = useAuth();
  const navigate = useNavigate();
  const [confirmEmail, setConfirmEmail] = useState(user?.email || '');
  const [consent, setConsent] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await authApi.requestAccountDeletion();
    },
    onSuccess: () => {
      toast.success('Deletion request submitted. We will confirm via email.');
      clearAuth();
      navigate('/login');
    },
    onError: () => {
      toast.error('Could not submit deletion request. Please email Support@FanzUnlimited.com.');
    },
  });

  const canSubmit = useMemo(() => {
    if (!isAuthenticated || !user?.email) return false;
    return consent && confirmEmail.trim().toLowerCase() === user.email.trim().toLowerCase() && !deleteMutation.isPending;
  }, [isAuthenticated, user?.email, consent, confirmEmail, deleteMutation.isPending]);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link to="/settings">
          <Button variant="ghost" className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
        </Link>

        <Card className="p-6 sm:p-10 space-y-6">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-10 w-10 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Delete Account & Data</h1>
              <p className="text-muted-foreground">Last updated: December 15, 2025</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr,1.1fr]">
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Submit a deletion request to remove your account and associated data via our API. This action is permanent.
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Email on account</Label>
                  <Input
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    placeholder="your@email.com"
                    disabled={!isAuthenticated}
                  />
                  {!isAuthenticated && (
                    <p className="text-sm text-muted-foreground">
                      Log in to submit a deletion request from your account.
                    </p>
                  )}
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox
                    id="consent"
                    checked={consent}
                    onCheckedChange={(checked) => setConsent(checked === true)}
                    disabled={!isAuthenticated}
                  />
                  <Label htmlFor="consent" className="leading-snug cursor-pointer">
                    I understand this will permanently delete my account and associated data.
                  </Label>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    className="gradient-primary"
                    onClick={() => deleteMutation.mutate()}
                    disabled={!canSubmit}
                  >
                    {deleteMutation.isPending ? 'Submitting...' : 'Delete My Account'}
                  </Button>
                  {!isAuthenticated && (
                    <Link to="/login">
                      <Button variant="outline">Log in to continue</Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-2">
              <h3 className="font-semibold text-destructive">Before you request deletion</h3>
              <p className="text-sm text-muted-foreground">
                Deletion signs you out everywhere and removes your records. Some limited logs may be retained for security or compliance (see below).
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">If the in-app request fails</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                If you can’t submit the form, email us from your account address and we will process the deletion.
              </p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Send an email from your account address to{' '}
                  <a className="text-primary underline" href="mailto:Support@FanzUnlimited.com?subject=Delete%20Account%20Request">
                    Support@FanzUnlimited.com
                  </a>{' '}
                  with the subject “Delete Account Request”.</li>
                <li>Include: your full name, the email on your account, and confirmation that you want your account and data deleted.</li>
                <li>We will confirm receipt and complete deletion within 7 business days.</li>
              </ol>
              <p className="text-sm">
                If you cannot email from your account address, include a contact method so we can verify ownership before deleting.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold">What will be deleted</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>Account profile and authentication data</li>
              <li>Messages, contacts, events, and workflow records</li>
              <li>API keys and integration credentials stored with your account</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold">What we may retain temporarily</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>Audit and security logs retained for up to 30 days for fraud prevention</li>
              <li>Legal records we are required to keep (billing history, compliance logs)</li>
            </ul>
            <p className="text-muted-foreground">
              These retained records are isolated and not used for product features.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Need help?</h2>
            <p className="text-muted-foreground">
              Contact{' '}
              <a className="text-primary underline" href="mailto:Support@FanzUnlimited.com">
                Support@FanzUnlimited.com
              </a>{' '}
              and we will assist you.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
