import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Sidebar />
      {/* Mobile: no margin, Desktop: margin for sidebar */}
      <div className="lg:ml-72 transition-all duration-300 w-full overflow-x-hidden">
        <TopBar />
        <main className="px-3 py-4 sm:px-4 lg:px-6 pt-16 lg:pt-6 overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}