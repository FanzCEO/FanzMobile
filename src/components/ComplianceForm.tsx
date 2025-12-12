import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ComplianceData {
  has_costar: boolean;
  name?: string;
  email?: string;
  phone?: string;
  handle?: string;
}

interface ComplianceFormProps {
  onSubmit: (data: ComplianceData) => void;
}

export default function ComplianceForm({ onSubmit }: ComplianceFormProps) {
  const [hasCostar, setHasCostar] = useState(false);
  const [costarData, setCostarData] = useState({
    name: '',
    email: '',
    phone: '',
    handle: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      has_costar: hasCostar,
      ...(hasCostar ? costarData : {})
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>🛡️</span>
          <span>18 U.S.C. §2257 Compliance</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Alert>
            <AlertDescription>
              All content must comply with 18 U.S.C. §2257 record-keeping requirements. 
              Co-star verification is mandatory for collaborative content.
            </AlertDescription>
          </Alert>

          <div className="flex items-center space-x-2">
            <Switch
              id="has-costar"
              checked={hasCostar}
              onCheckedChange={setHasCostar}
            />
            <Label htmlFor="has-costar">This content includes a co-star/collaborator</Label>
          </div>

          {hasCostar && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium">Co-star Information</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="costar-name">Full Name *</Label>
                  <Input
                    id="costar-name"
                    value={costarData.name}
                    onChange={(e) => setCostarData({...costarData, name: e.target.value})}
                    placeholder="Enter full legal name"
                    required={hasCostar}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="costar-handle">Platform Handle</Label>
                  <Input
                    id="costar-handle"
                    value={costarData.handle}
                    onChange={(e) => setCostarData({...costarData, handle: e.target.value})}
                    placeholder="@username (if verified)"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="costar-email">Email Address *</Label>
                  <Input
                    id="costar-email"
                    type="email"
                    value={costarData.email}
                    onChange={(e) => setCostarData({...costarData, email: e.target.value})}
                    placeholder="verification@example.com"
                    required={hasCostar}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="costar-phone">Phone Number</Label>
                  <Input
                    id="costar-phone"
                    type="tel"
                    value={costarData.phone}
                    onChange={(e) => setCostarData({...costarData, phone: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  <div className="space-y-2">
                    <p>Co-star verification process:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>If @username is provided and already verified, verification is skipped</li>
                      <li>Otherwise, an automated verification link will be sent via email/SMS</li>
                      <li>Co-star must complete VerifyMy ID verification before content approval</li>
                      <li>All records are maintained for compliance audit purposes</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="flex space-x-2">
            <Button type="submit" className="flex-1">
              {hasCostar ? 'Submit & Send Verification' : 'Confirm Compliance'}
            </Button>
            <Button type="button" variant="outline">
              Save Draft
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}