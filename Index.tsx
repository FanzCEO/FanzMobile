import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import MobileNavigation from '@/components/MobileNavigation';
import MobileDashboard from '@/pages/MobileDashboard';
import MobileUpload from '@/pages/MobileUpload';
import MobileCompliance from '@/pages/MobileCompliance';
import MobileScheduler from '@/pages/MobileScheduler';
import MobileProfile from '@/pages/MobileProfile';
import CRMDashboard from '@/components/CRMDashboard';
import AnalyticsReporting from '@/components/AnalyticsReporting';
import CloudStorageManager from '@/components/CloudStorageManager';
import AdminPanel from '@/pages/AdminPanel';

export default function Index() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({ email: '', password: '' });
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // Check for admin access on load
  useEffect(() => {
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      setIsAdminMode(true);
    }
  }, []);

  const handleAdminLogin = () => {
    // Simulate admin authentication
    if (adminCredentials.email === 'admin@fanz.com' && adminCredentials.password === 'admin123') {
      setIsAdminMode(true);
      setShowAdminLogin(false);
      setCurrentPage('admin');
      localStorage.setItem('admin_token', 'admin_token_' + Date.now());
    } else {
      alert('Invalid admin credentials');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminMode(false);
    setCurrentPage('dashboard');
    localStorage.removeItem('admin_token');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <MobileDashboard onPageChange={setCurrentPage} />;
      case 'upload':
        return <MobileUpload onPageChange={setCurrentPage} />;
      case 'compliance':
        return <MobileCompliance onPageChange={setCurrentPage} />;
      case 'scheduler':
        return <MobileScheduler onPageChange={setCurrentPage} />;
      case 'profile':
        return <MobileProfile onPageChange={setCurrentPage} />;
      case 'crm':
        return <CRMDashboard />;
      case 'analytics':
        return <AnalyticsReporting />;
      case 'storage':
        return <CloudStorageManager />;
      case 'admin':
        return <AdminPanel onPageChange={setCurrentPage} />;
      default:
        return <MobileDashboard onPageChange={setCurrentPage} />;
    }
  };

  const showBackButton = ['crm', 'analytics', 'storage'].includes(currentPage);
  const showAdminBackButton = currentPage === 'admin';

  // Admin login modal
  if (showAdminLogin) {
    return (
      <div className="min-h-screen bg-background max-w-sm mx-auto flex items-center justify-center p-4">
        <Card className="w-full">
          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-semibold">Admin Access</h2>
              <p className="text-sm text-muted-foreground">Enter admin credentials</p>
            </div>
            
            <div className="space-y-3">
              <Input
                type="email"
                placeholder="Admin email"
                value={adminCredentials.email}
                onChange={(e) => setAdminCredentials(prev => ({ ...prev, email: e.target.value }))}
              />
              <Input
                type="password"
                placeholder="Admin password"
                value={adminCredentials.password}
                onChange={(e) => setAdminCredentials(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowAdminLogin(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleAdminLogin} className="flex-1">
                Login
              </Button>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Demo credentials: admin@fanz.com / admin123
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-sm mx-auto relative overflow-hidden">
      {/* Mobile Status Bar */}
      <div className="h-6 bg-black flex items-center justify-between px-4 text-white text-xs">
        <span>9:41</span>
        <div className="flex items-center space-x-1">
          <span>📶</span>
          <span>📶</span>
          <span>🔋</span>
          {/* Admin indicator */}
          {isAdminMode && (
            <span className="bg-red-600 px-1 rounded text-xs">ADMIN</span>
          )}
        </div>
      </div>
      
      <main className="pb-20">
        {renderPage()}
      </main>
      
      {/* Regular navigation */}
      {!showBackButton && !showAdminBackButton && (
        <MobileNavigation currentPage={currentPage} onPageChange={setCurrentPage} />
      )}
      
      {/* Back button for sub-pages */}
      {showBackButton && (
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-background/95 backdrop-blur border-t p-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => setCurrentPage('profile')}
          >
            ← Back to Profile
          </Button>
        </div>
      )}
      
      {/* Admin panel controls */}
      {showAdminBackButton && (
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-red-50 border-t border-red-200 p-2 space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => setCurrentPage('dashboard')}
          >
            ← Exit Admin Panel
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            className="w-full"
            onClick={handleAdminLogout}
          >
            🚪 Admin Logout
          </Button>
        </div>
      )}
      
      {/* Admin access button (hidden admin entry point) */}
      {!isAdminMode && currentPage === 'profile' && (
        <div 
          className="fixed bottom-24 right-4 w-8 h-8 opacity-10 hover:opacity-100 transition-opacity cursor-pointer"
          onClick={() => setShowAdminLogin(true)}
          title="Admin Access"
        >
          <div className="w-full h-full bg-red-600 rounded-full flex items-center justify-center text-white text-xs">
            A
          </div>
        </div>
      )}
    </div>
  );
}