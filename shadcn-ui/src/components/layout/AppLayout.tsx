import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      {/* Mobile: no margin, Desktop: margin for sidebar */}
      <div className="lg:ml-72 transition-all duration-300">
        <TopBar />
        <main className="p-4 lg:p-6 pt-16 lg:pt-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}