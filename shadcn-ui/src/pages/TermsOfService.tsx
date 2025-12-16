import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/settings">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
        </Link>

        <Card className="p-6 sm:p-10">
          <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 2025</p>

          <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing or using WickedCRM ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
              <p className="text-muted-foreground">
                WickedCRM is a customer relationship management platform that provides message syncing, contact management, AI-powered insights, workflow automation, and related services for business communication.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>You must provide accurate and complete registration information</li>
                <li>You are responsible for maintaining the security of your account</li>
                <li>You must notify us immediately of any unauthorized access</li>
                <li>One person or legal entity may maintain only one account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Acceptable Use</h2>
              <p className="text-muted-foreground">You agree not to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
                <li>Use the Service for any illegal purpose</li>
                <li>Send spam or unsolicited messages</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Attempt to gain unauthorized access to the Service</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Upload malicious code or content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. SMS and Messaging Compliance</h2>
              <p className="text-muted-foreground">
                When using our messaging features, you agree to comply with all applicable laws including:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
                <li>Telephone Consumer Protection Act (TCPA)</li>
                <li>CAN-SPAM Act</li>
                <li>GDPR (for EU users)</li>
                <li>All carrier and messaging platform policies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Intellectual Property</h2>
              <p className="text-muted-foreground">
                The Service and its original content, features, and functionality are owned by Fanz LLC and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. User Content</h2>
              <p className="text-muted-foreground">
                You retain ownership of content you submit to the Service. By submitting content, you grant us a license to use, store, and process that content to provide the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. AI Features</h2>
              <p className="text-muted-foreground">
                Our AI-powered features are provided "as is" and may not be 100% accurate. You are responsible for reviewing AI-generated content before use. We are not liable for decisions made based on AI recommendations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Payment and Billing</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Memberships start at $5.99 per week and auto-renew unless canceled</li>
                <li>Each billing period includes a small free AI usage allowance; additional AI usage is billed on a metered basis at the posted rates</li>
                <li>Subscription fees are billed in advance</li>
                <li>All fees are non-refundable unless required by law</li>
                <li>We may change pricing with 30 days notice</li>
                <li>Failure to pay may result in service suspension</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Termination</h2>
              <p className="text-muted-foreground">
                We may terminate or suspend your account at any time for violation of these terms. You may cancel your account at any time through the Settings page. Upon termination, your data will be deleted according to our data retention policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground">
                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                IN NO EVENT SHALL FANZ LLC BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">13. Indemnification</h2>
              <p className="text-muted-foreground">
                You agree to indemnify and hold harmless Fanz LLC from any claims, damages, or expenses arising from your use of the Service or violation of these terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">14. Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms shall be governed by the laws of the State of Delaware, United States, without regard to conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">15. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these terms at any time. We will notify users of material changes via email or in-app notification. Continued use after changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">16. Contact Information</h2>
              <p className="text-muted-foreground">
                For questions about these Terms, contact us at:
              </p>
              <p className="text-muted-foreground mt-2">
                Email: legal@wickedcrm.com<br />
                Address: Fanz LLC, United States
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
