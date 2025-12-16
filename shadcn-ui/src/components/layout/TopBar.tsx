import { useState } from 'react';
import { Bell, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export function TopBar() {
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'New message from Sarah', type: 'message', read: false },
    { id: '2', title: 'Workflow ran: Auto-confirm meetings', type: 'workflow', read: false },
    { id: '3', title: 'Import complete', type: 'system', read: true },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="h-16 glass-panel border-b border-white/10 flex items-center justify-between px-4 lg:px-6">
      {/* Search - hidden on mobile, show on tablet+ */}
      <div className="flex-1 max-w-xl hidden sm:block ml-12 lg:ml-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages, contacts, events..."
            className="pl-10 bg-white/5 border-white/10 focus:border-primary"
          />
        </div>
      </div>

      {/* Mobile: just show title */}
      <div className="sm:hidden ml-12">
        <h1 className="text-lg font-bold text-gradient">WickedCRM</h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs px-2 py-1" onClick={markAllRead}>
                  Mark all read
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <DropdownMenuItem className="text-muted-foreground text-sm">No notifications</DropdownMenuItem>
            ) : (
              notifications.map((n) => (
                <DropdownMenuItem key={n.id} className="flex items-center gap-2 text-sm">
                  {n.type === 'message' && <AlertCircle className="h-4 w-4 text-primary" />}
                  {n.type === 'workflow' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {n.type === 'system' && <Badge variant="secondary">Info</Badge>}
                  <span className={n.read ? 'text-muted-foreground' : ''}>{n.title}</span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
