import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

interface AdminPanelProps {
  onPageChange: (page: string) => void;
}

export default function AdminPanel({ onPageChange }: AdminPanelProps) {
  const [currentAdmin] = useState({
    id: 'admin_1',
    email: 'admin@fanz.com',
    role: 'super_admin',
    permissions: ['users', 'content', 'analytics', 'system']
  });

  const [systemStats] = useState({
    totalUsers: 15247,
    activeUsers: 12890,
    totalContent: 89247,
    totalRevenue: 1247890.50,
    dmcaRequests: 1247,
    dmcaSuccessRate: 98.7,
    storageUsed: 847, // GB
    storageTotal: 2500, // GB
    apiRequests: 2847293,
    systemUptime: 99.9
  });

  const [recentUsers] = useState([
    {
      id: 'user_1',
      email: 'alex@example.com',
      handle: '@alexcreator',
      subscription_tier: 'premium',
      total_earnings: 12847.25,
      is_active: true,
      created_at: '2024-01-15T10:30:00Z'
    },
    {
      id: 'user_2',
      email: 'sarah@example.com',
      handle: '@sarahfitness',
      subscription_tier: 'enterprise',
      total_earnings: 25690.75,
      is_active: true,
      created_at: '2024-01-14T15:20:00Z'
    },
    {
      id: 'user_3',
      email: 'mike@example.com',
      handle: '@mikeworkout',
      subscription_tier: 'free',
      total_earnings: 0,
      is_active: false,
      created_at: '2024-01-13T09:15:00Z'
    }
  ]);

  const [recentContent] = useState([
    {
      id: 'content_1',
      title: 'Morning Workout Routine',
      user: '@alexcreator',
      status: 'ready',
      views: 15200,
      revenue: 347.50,
      dmca_protected: true,
      created_at: '2024-01-15T08:30:00Z'
    },
    {
      id: 'content_2',
      title: 'Nutrition Tips',
      user: '@sarahfitness',
      status: 'processing',
      views: 0,
      revenue: 0,
      dmca_protected: true,
      created_at: '2024-01-15T10:15:00Z'
    }
  ]);

  const [dmcaRecords] = useState([
    {
      id: 'dmca_1',
      content_id: 'content_1',
      infringing_url: 'https://pirate-site.com/stolen-content',
      status: 'resolved',
      issued_at: '2024-01-14T12:00:00Z',
      resolved_at: '2024-01-14T14:30:00Z',
      response_time_hours: 2.5
    },
    {
      id: 'dmca_2',
      content_id: 'content_3',
      infringing_url: 'https://illegal-sharing.net/video123',
      status: 'pending',
      issued_at: '2024-01-15T09:00:00Z',
      resolved_at: null,
      response_time_hours: null
    }
  ]);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'enterprise': return 'bg-purple-600';
      case 'premium': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-600';
      case 'processing': return 'bg-yellow-600';
      case 'failed': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const suspendUser = (userId: string) => {
    console.log(`Suspending user: ${userId}`);
    // API call would go here
  };

  const deleteContent = (contentId: string) => {
    console.log(`Deleting content: ${contentId}`);
    // API call would go here
  };

  const resolveDMCA = (dmcaId: string) => {
    console.log(`Resolving DMCA: ${dmcaId}`);
    // API call would go here
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">
            Logged in as {currentAdmin.email} ({currentAdmin.role})
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onPageChange('dashboard')}>
          Exit Admin
        </Button>
      </div>

      {/* System Status Alert */}
      <Alert>
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span className="font-medium">🟢 System Status: All systems operational</span>
            <Badge className="bg-green-600">
              {systemStats.systemUptime}% uptime
            </Badge>
          </div>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{systemStats.totalUsers.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Total Users</div>
                <div className="text-xs text-green-600 mt-1">
                  {systemStats.activeUsers.toLocaleString()} active
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  ${systemStats.totalRevenue.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Total Revenue</div>
                <div className="text-xs text-green-600 mt-1">+15.2% this month</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{systemStats.totalContent.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Total Content</div>
                <div className="text-xs text-purple-600 mt-1">All protected</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{systemStats.dmcaSuccessRate}%</div>
                <div className="text-xs text-muted-foreground">DMCA Success</div>
                <div className="text-xs text-red-600 mt-1">{systemStats.dmcaRequests} requests</div>
              </CardContent>
            </Card>
          </div>

          {/* System Resources */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">System Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Storage Usage</span>
                  <span>{systemStats.storageUsed}GB / {systemStats.storageTotal}GB</span>
                </div>
                <Progress value={(systemStats.storageUsed / systemStats.storageTotal) * 100} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-blue-600">{systemStats.apiRequests.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">API Requests Today</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">{systemStats.systemUptime}%</div>
                  <div className="text-xs text-muted-foreground">System Uptime</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform Distribution */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Platform Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { platform: 'BoyFanz', users: 8247, revenue: 847290.50, color: 'bg-blue-600' },
                { platform: 'GirlFanz', users: 5890, revenue: 324567.25, color: 'bg-pink-600' },
                { platform: 'PupFanz', users: 1110, revenue: 76032.75, color: 'bg-purple-600' }
              ].map((platform, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${platform.color}`} />
                    <div>
                      <p className="font-medium text-sm">{platform.platform}</p>
                      <p className="text-xs text-muted-foreground">{platform.users} users</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">${platform.revenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">revenue</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          {/* User Search */}
          <Card>
            <CardContent className="p-4">
              <div className="flex space-x-2">
                <Input placeholder="Search users by email or handle..." className="flex-1" />
                <Button>Search</Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Users */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Recent Users</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {user.handle.substring(1, 3).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-sm">{user.handle}</p>
                        <Badge className={`text-xs ${getTierColor(user.subscription_tier)}`}>
                          {user.subscription_tier}
                        </Badge>
                        {!user.is_active && (
                          <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                            Suspended
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-green-600">
                          ${user.total_earnings.toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm">
                      👁️
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => suspendUser(user.id)}
                      className="text-red-600"
                    >
                      🚫
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          {/* Content Moderation Queue */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Content Moderation Queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentContent.map((content) => (
                <div key={content.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xl">
                      🎬
                    </div>
                    <div>
                      <p className="font-medium text-sm">{content.title}</p>
                      <p className="text-xs text-muted-foreground">by {content.user}</p>
                      <div className="flex items-center space-x-3 mt-1">
                        <Badge className={`text-xs ${getStatusColor(content.status)}`}>
                          {content.status}
                        </Badge>
                        {content.dmca_protected && (
                          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                            🛡️ Protected
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          👁️ {content.views.toLocaleString()}
                        </span>
                        <span className="text-xs text-green-600">
                          💰 ${content.revenue}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm">
                      👁️
                    </Button>
                    <Button variant="ghost" size="sm">
                      ✅
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteContent(content.id)}
                      className="text-red-600"
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          {/* DMCA Protection Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{systemStats.dmcaRequests}</div>
                <div className="text-xs text-muted-foreground">DMCA Requests</div>
                <div className="text-xs text-green-600 mt-1">{systemStats.dmcaSuccessRate}% success</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">2.3h</div>
                <div className="text-xs text-muted-foreground">Avg Response Time</div>
                <div className="text-xs text-blue-600 mt-1">Industry leading</div>
              </CardContent>
            </Card>
          </div>

          {/* DMCA Records */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Recent DMCA Records</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dmcaRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge className={record.status === 'resolved' ? 'bg-green-600' : 'bg-yellow-600'}>
                        {record.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Content: {record.content_id}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {record.infringing_url}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        Issued: {new Date(record.issued_at).toLocaleDateString()}
                      </span>
                      {record.response_time_hours && (
                        <span className="text-xs text-green-600">
                          Resolved in {record.response_time_hours}h
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {record.status === 'pending' && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => resolveDMCA(record.id)}
                    >
                      Resolve
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Forensic Watermarking</span>
                  <Badge className="bg-green-600">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">DMCA Monitoring</span>
                  <Badge className="bg-green-600">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Content Fingerprinting</span>
                  <Badge className="bg-green-600">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Rate Limiting</span>
                  <Badge className="bg-green-600">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}