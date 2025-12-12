import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { mockAssets, mockPosts, mockCompliance } from '@/lib/mockData';

interface AdminProps {
  onPageChange: (page: string) => void;
}

export default function Admin({ onPageChange }: AdminProps) {
  const adminStats = [
    { label: 'Pending Reviews', value: '12', icon: '⏳', color: 'bg-yellow-600' },
    { label: 'Approved Today', value: '28', icon: '✅', color: 'bg-green-600' },
    { label: 'Flagged Content', value: '3', icon: '🚩', color: 'bg-red-600' },
    { label: 'Active Creators', value: '156', icon: '👥', color: 'bg-blue-600' }
  ];

  const pendingReviews = [
    {
      id: '1',
      creator: '@alexcreator',
      title: 'Beach Workout Session',
      type: 'video',
      uploaded: '2024-10-29T14:30:00Z',
      compliance: 'verified',
      flagged: false,
      thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100'
    },
    {
      id: '2',
      creator: '@janecreator',
      title: 'Morning Routine Content',
      type: 'video',
      uploaded: '2024-10-29T12:15:00Z',
      compliance: 'pending',
      flagged: true,
      thumbnail: 'https://images.unsplash.com/photo-1506629905607-d9c297d3d45b?w=100'
    },
    {
      id: '3',
      creator: '@mikecreator',
      title: 'Collaboration Special',
      type: 'video',
      uploaded: '2024-10-29T10:45:00Z',
      compliance: 'verified',
      flagged: false,
      thumbnail: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=100'
    }
  ];

  const auditLogs = [
    { action: 'Content Approved', admin: 'admin@fanz.com', target: 'Beach Workout Session', time: '10 minutes ago' },
    { action: 'User Suspended', admin: 'moderator@fanz.com', target: '@violator', time: '1 hour ago' },
    { action: 'Compliance Override', admin: 'admin@fanz.com', target: 'Morning Routine', time: '2 hours ago' },
    { action: 'Content Flagged', admin: 'system', target: 'Suspicious Upload', time: '3 hours ago' }
  ];

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-600';
      case 'pending': return 'bg-yellow-600';
      case 'failed': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Content moderation and platform management</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <span className="mr-2">📊</span>
            Analytics
          </Button>
          <Button variant="outline">
            <span className="mr-2">⚙️</span>
            Settings
          </Button>
        </div>
      </div>

      {/* Admin Stats */}
      <div className="grid grid-cols-4 gap-4">
        {adminStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-full ${stat.color} flex items-center justify-center text-white text-xl`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="review" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="review">Content Review</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        {/* Content Review */}
        <TabsContent value="review" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Pending Content Reviews</h2>
            <div className="flex space-x-2">
              <Input placeholder="Search content..." className="w-64" />
              <Button variant="outline">Filter</Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Content</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Compliance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingReviews.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <img 
                            src={item.thumbnail} 
                            alt={item.title}
                            className="w-12 h-12 rounded object-cover"
                          />
                          <div>
                            <p className="font-medium">{item.title}</p>
                            {item.flagged && (
                              <Badge variant="destructive" className="text-xs">
                                🚩 Flagged
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{item.creator}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.type}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(item.uploaded).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getComplianceColor(item.compliance)}>
                          {item.compliance}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Pending Review</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="default">
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive">
                            Reject
                          </Button>
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Management */}
        <TabsContent value="compliance" className="space-y-4">
          <h2 className="text-xl font-semibold">Compliance Management</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>2257 Compliance Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Records</span>
                    <span className="font-medium">1,247</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Verified</span>
                    <span className="font-medium text-green-600">1,198</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending</span>
                    <span className="font-medium text-yellow-600">42</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Failed/Expired</span>
                    <span className="font-medium text-red-600">7</span>
                  </div>
                </div>
                
                <Button className="w-full">
                  Generate Compliance Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Verification Providers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>VerifyMy</span>
                    <Badge className="bg-green-600">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Manual Review</span>
                    <Badge className="bg-blue-600">Available</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>ID.me</span>
                    <Badge variant="secondary">Inactive</Badge>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full">
                  Manage Providers
                </Button>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Compliance Alert:</strong> 7 records require immediate attention due to expired verification. 
              Automatic content takedown will occur in 24 hours if not resolved.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* User Management */}
        <TabsContent value="users" className="space-y-4">
          <h2 className="text-xl font-semibold">User Management</h2>
          
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">2,847</div>
                <div className="text-sm text-muted-foreground">Total Creators</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">156</div>
                <div className="text-sm text-muted-foreground">Active Today</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">23</div>
                <div className="text-sm text-muted-foreground">Suspended</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent User Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { user: '@newcreator', action: 'Account created', time: '5 minutes ago', status: 'success' },
                  { user: '@alexcreator', action: 'Content uploaded', time: '15 minutes ago', status: 'info' },
                  { user: '@violator', action: 'Account suspended', time: '1 hour ago', status: 'warning' },
                  { user: '@janecreator', action: 'Verification completed', time: '2 hours ago', status: 'success' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.status === 'success' ? 'bg-green-600' :
                        activity.status === 'info' ? 'bg-blue-600' :
                        activity.status === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
                      }`} />
                      <div>
                        <p className="font-medium">{activity.user}</p>
                        <p className="text-sm text-muted-foreground">{activity.action}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log */}
        <TabsContent value="audit" className="space-y-4">
          <h2 className="text-xl font-semibold">System Audit Log</h2>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Admin/System</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{log.action}</TableCell>
                      <TableCell>{log.admin}</TableCell>
                      <TableCell>{log.target}</TableCell>
                      <TableCell>{log.time}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}