import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Cloud, Upload, Shield, Cpu, HardDrive, Lock, Zap, BarChart3, Bot, LogIn, FileVideo, Database } from "lucide-react";
import AIChatBot from "@/components/AIChatBot";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();

  const handleLogin = () => {
    setLocation("/auth/login");
  };

  const handleSignup = () => {
    setLocation("/auth/fanz-signup");
  };

  const handleCreatorSignup = () => {
    setLocation("/auth/starz-signup");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white" data-testid="landing-page">
      {/* ACCESSIBILITY: Skip link for keyboard users */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Hero Section */}
      <main id="main-content" className="relative overflow-hidden" role="main" aria-label="FanzMobile cloud drive introduction">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-slate-950"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            {/* Cloud Logo */}
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/30">
                <Cloud className="w-14 h-14 text-white" />
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              FanzMobile
            </h1>
            <p className="text-2xl md:text-3xl text-blue-300 font-semibold mb-6">
              Cloud Drive for Creators
            </p>
            <p className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto">
              Enterprise-grade cloud storage with AI-powered media processing, compliance automation, and intelligent distribution. Built for content creators who demand more.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Button
                onClick={handleSignup}
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-lg shadow-blue-500/25"
                data-testid="signup-button"
              >
                <Cloud className="w-5 h-5 mr-2" />
                Get Started Free
              </Button>
              <Button
                onClick={handleCreatorSignup}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-blue-500/50 text-blue-300 hover:bg-blue-500/10 font-semibold px-8 py-6 text-lg rounded-xl"
                data-testid="creator-signup-button"
              >
                <Upload className="w-5 h-5 mr-2" />
                Creator Account
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">500GB</div>
                <div className="text-sm text-slate-500">Free Storage</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">99.9%</div>
                <div className="text-sm text-slate-500">Uptime SLA</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">AI</div>
                <div className="text-sm text-slate-500">Powered Processing</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">2257</div>
                <div className="text-sm text-slate-500">Compliant</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-24 bg-slate-900/50" aria-label="Platform features" role="region">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-white">
              Everything You Need in One Platform
            </h2>
            <p className="text-xl text-slate-400">
              Powerful tools for media processing, compliance, and distribution
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                  <HardDrive className="text-blue-400 h-6 w-6" />
                </div>
                <CardTitle className="text-white">Secure Cloud Storage</CardTitle>
                <CardDescription className="text-slate-400">
                  Enterprise-grade encrypted storage with automatic backups and version control for all your media files.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Cpu className="text-purple-400 h-6 w-6" />
                </div>
                <CardTitle className="text-white">AI Media Processing</CardTitle>
                <CardDescription className="text-slate-400">
                  Automatic transcoding, thumbnail generation, and intelligent content analysis powered by advanced AI.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="text-blue-400 h-6 w-6" />
                </div>
                <CardTitle className="text-white">Compliance Automation</CardTitle>
                <CardDescription className="text-slate-400">
                  Built-in 2257 record-keeping, age verification, and regulatory compliance tools for content creators.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                  <FileVideo className="text-purple-400 h-6 w-6" />
                </div>
                <CardTitle className="text-white">Multi-Format Support</CardTitle>
                <CardDescription className="text-slate-400">
                  Upload any format - we automatically convert and optimize for web, mobile, and streaming platforms.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                  <BarChart3 className="text-blue-400 h-6 w-6" />
                </div>
                <CardTitle className="text-white">Analytics Dashboard</CardTitle>
                <CardDescription className="text-slate-400">
                  Real-time insights into storage usage, processing status, and content performance metrics.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Zap className="text-purple-400 h-6 w-6" />
                </div>
                <CardTitle className="text-white">Lightning Fast CDN</CardTitle>
                <CardDescription className="text-slate-400">
                  Global content delivery network ensures your media loads instantly anywhere in the world.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="py-24 bg-gradient-to-br from-blue-900/20 via-slate-950 to-purple-900/20" aria-label="AI features" role="region">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-white">
              AI-Powered Automation
            </h2>
            <p className="text-xl text-slate-400 mb-8">
              Let AI handle the heavy lifting so you can focus on creating
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-slate-800/30 border-blue-500/30 hover:bg-slate-800/50 transition-all">
              <CardHeader className="text-center">
                <div className="h-16 w-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                  <Bot className="h-8 w-8 text-blue-400" />
                </div>
                <CardTitle className="text-blue-300 text-lg">AI ASSISTANT</CardTitle>
                <CardDescription className="text-slate-400 text-sm">
                  Get instant help with uploads, processing, and platform questions via our intelligent AI assistant.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800/30 border-purple-500/30 hover:bg-slate-800/50 transition-all">
              <CardHeader className="text-center">
                <div className="h-16 w-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                  <Cpu className="h-8 w-8 text-purple-400" />
                </div>
                <CardTitle className="text-purple-300 text-lg">AUTO PROCESSING</CardTitle>
                <CardDescription className="text-slate-400 text-sm">
                  Automatic transcoding, compression, and format optimization without manual intervention.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800/30 border-blue-500/30 hover:bg-slate-800/50 transition-all">
              <CardHeader className="text-center">
                <div className="h-16 w-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                  <Shield className="h-8 w-8 text-blue-400" />
                </div>
                <CardTitle className="text-blue-300 text-lg">SMART COMPLIANCE</CardTitle>
                <CardDescription className="text-slate-400 text-sm">
                  AI-driven content moderation and automatic compliance documentation generation.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800/30 border-purple-500/30 hover:bg-slate-800/50 transition-all">
              <CardHeader className="text-center">
                <div className="h-16 w-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                  <Database className="h-8 w-8 text-purple-400" />
                </div>
                <CardTitle className="text-purple-300 text-lg">SMART TAGGING</CardTitle>
                <CardDescription className="text-slate-400 text-sm">
                  Automatic metadata extraction and intelligent content categorization for easy organization.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-lg text-slate-400 mb-6">
              Need help? Our AI assistant is available 24/7 in the bottom-right corner!
            </p>
            <div className="flex justify-center items-center space-x-2">
              <Bot className="h-5 w-5 text-blue-400 animate-pulse" />
              <span className="text-sm text-blue-300 font-medium">CLICK THE AI BUBBLE FOR INSTANT HELP</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24" aria-label="Call to action" role="region">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6 text-white">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-xl mb-8 text-slate-400">
            Join thousands of creators using <span className="text-blue-400 font-semibold">FanzMobile</span> for secure cloud storage and AI-powered media processing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleSignup}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-semibold text-lg px-8 py-4 rounded-xl"
              data-testid="cta-signup-button"
            >
              Start Free Today
            </Button>
            <Button
              onClick={handleLogin}
              variant="outline"
              size="lg"
              className="border-slate-600 text-slate-300 hover:bg-slate-800 font-semibold text-lg px-8 py-4 rounded-xl"
              data-testid="cta-login-button"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8" role="contentinfo" aria-label="Site footer">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <a href="/compliance" className="block text-sm text-slate-400 hover:text-slate-200">Terms & Conditions</a>
              <a href="/blog" className="block text-sm text-slate-400 hover:text-slate-200">About Us</a>
              <a href="/compliance" className="block text-sm text-slate-400 hover:text-slate-200">Privacy Policy</a>
              <a href="/contact" className="block text-sm text-slate-400 hover:text-slate-200">Contact</a>
            </div>
            <div className="space-y-2">
              <a href="/compliance" className="block text-sm text-slate-400 hover:text-slate-200">Data Governance</a>
              <a href="/compliance" className="block text-sm text-slate-400 hover:text-slate-200">Security</a>
              <a href="/compliance" className="block text-sm text-slate-400 hover:text-slate-200">Compliance</a>
              <a href="/contact" className="block text-sm text-slate-400 hover:text-slate-200">Support</a>
            </div>
            <div className="space-y-2">
              <a href="/release-forms" className="block text-sm text-slate-400 hover:text-slate-200">2257 Documentation</a>
              <a href="/compliance" className="block text-sm text-slate-400 hover:text-slate-200">Content Policy</a>
              <a href="/contact" className="block text-sm text-slate-400 hover:text-slate-200">Feature Request</a>
              <a href="/blog" className="block text-sm text-slate-400 hover:text-slate-200">Blog</a>
            </div>
            <div className="space-y-2">
              <a href="/subscriptions" className="block text-sm text-slate-400 hover:text-slate-200">Pricing</a>
              <a href="/contact" className="block text-sm text-slate-400 hover:text-slate-200">Enterprise</a>
              <a href="/contact" className="block text-sm text-slate-400 hover:text-slate-200">API Access</a>
              <a href="/contact" className="block text-sm text-slate-400 hover:text-slate-200">Developers</a>
            </div>
          </div>

          <div className="text-center mb-4">
            <p className="text-xs text-slate-500">
              2025 FanzMobile. All rights reserved. FANZ (FANZ) L.L.C. - 30 N Gould St #45302 Sheridan, Wyoming, United States
            </p>
          </div>

          <div className="flex justify-center items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500">PROTECTED BY:</span>
              <div className="flex items-center space-x-1">
                <div className="bg-green-600 text-white px-2 py-1 text-xs font-bold rounded">DMCA</div>
                <span className="text-xs text-slate-500">DMCA.com COMPLIANT</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* AI Chatbot Component */}
      <AIChatBot />
    </div>
  );
}
