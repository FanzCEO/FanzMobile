import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MobileNavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export default function MobileNavigation({ currentPage, onPageChange }: MobileNavigationProps) {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: '🏠' },
    { id: 'upload', label: 'Upload', icon: '📤', badge: true },
    { id: 'compliance', label: 'Verify', icon: '🛡️' },
    { id: 'scheduler', label: 'Schedule', icon: '📅' },
    { id: 'profile', label: 'Profile', icon: '👤' }
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-background/95 backdrop-blur border-t">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(item.id)}
            className={`flex flex-col items-center space-y-1 h-auto py-2 px-3 relative ${
              currentPage === item.id ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <div className="relative">
              <span className="text-lg">{item.icon}</span>
              {item.badge && (
                <Badge className="absolute -top-1 -right-1 w-2 h-2 p-0 bg-red-500" />
              )}
            </div>
            <span className="text-xs">{item.label}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
}