import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth, useUserProfile } from '@/hooks/useSupabase';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export default function Navigation({ currentPage, onPageChange }: NavigationProps) {
  const { user, signOut } = useAuth();
  const { data: userProfile } = useUserProfile(user?.id);
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'upload', label: 'Upload', icon: '📤' },
    { id: 'compliance', label: 'Compliance', icon: '🛡️' },
    { id: 'scheduler', label: 'Scheduler', icon: '📅' },
    { id: 'admin', label: 'Admin', icon: '⚙️' }
  ];

  // Get user's primary platform from profile or default
  const userPlatform = userProfile?.platform_memberships?.[0]?.platforms?.name || 'BoyFanz';
  const userHandle = userProfile?.handle ? `@${userProfile.handle}` : user?.email?.split('@')[0] || '@user';
  const userEmail = userProfile?.email || user?.email || '';

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              FANZ
            </div>
            <Badge variant="secondary" className="text-xs">AI Cloud</Badge>
          </div>
        </div>

        <div className="flex items-center space-x-1 mx-6">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={currentPage === item.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onPageChange(item.id)}
              className="flex items-center space-x-2"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Button>
          ))}
        </div>

        <div className="ml-auto flex items-center space-x-4">
          <Badge 
            className={`${
              userPlatform === 'BoyFanz' ? 'bg-blue-600' :
              userPlatform === 'GirlFanz' ? 'bg-pink-600' : 'bg-purple-600'
            }`}
          >
            {userPlatform}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userProfile?.avatar_url || "/avatars/01.png"} alt={userHandle} />
                  <AvatarFallback>
                    {userHandle.substring(1, 3).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userHandle}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userEmail}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                Support
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={async () => {
                await signOut();
              }}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}