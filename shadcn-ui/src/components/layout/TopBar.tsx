import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function TopBar() {
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
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
        </Button>
      </div>
    </div>
  );
}