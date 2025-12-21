import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import MediaCard from '@/components/MediaCard';
import ProcessingStatus from '@/components/ProcessingStatus';
import { mockAssets, mockJobs, mockPosts, platforms } from '@/lib/mockData';

interface DashboardProps {
  onPageChange: (page: string) => void;
}

export default function Dashboard({ onPageChange }: DashboardProps) {
  const stats = [
    { label: 'Total Assets', value: '24', change: '+3 this week', icon: '📁' },
    { label: 'Processing', value: '2', change: 'AI enhancement', icon: '⚙️' },
    { label: 'Scheduled Posts', value: '8', change: 'Next: 2 hours', icon: '📅' },
    { label: 'Revenue', value: '$2,847', change: '+12% this month', icon: '💰' }
  ];

  const recentAssets = mockAssets.slice(0, 3);
  const activeJobs = mockJobs.filter(job => job.status === 'processing');

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Creator Dashboard</h1>
          <p className="text-muted-foreground">Manage your content and track performance</p>
        </div>
        <Button onClick={() => onPageChange('upload')} className="bg-gradient-to-r from-blue-600 to-purple-600">
          <span className="mr-2">📤</span>
          Upload Content
        </Button>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-3 gap-4">
        {platforms.map((platform) => (
          <Card key={platform.name}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{platform.name}</p>
                  <p className="text-2xl font-bold">{platform.users}</p>
                  <p className="text-xs text-muted-foreground">Active Users</p>
                </div>
                <div className={`w-12 h-12 rounded-full ${platform.color} flex items-center justify-center text-white font-bold`}>
                  {platform.name[0]}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{stat.icon}</span>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Recent Content */}
        <div className="col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Recent Content</h2>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {recentAssets.map((asset) => (
              <MediaCard
                key={asset.id}
                asset={asset}
                jobs={mockJobs}
                onView={() => console.log('View asset:', asset.id)}
                onEdit={() => console.log('Edit asset:', asset.id)}
              />
            ))}
          </div>
        </div>

        {/* Processing Status */}
        <div className="space-y-4">
          <ProcessingStatus jobs={activeJobs} />
          
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => onPageChange('upload')}
              >
                <span className="mr-2">📤</span>
                Upload New Content
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => onPageChange('scheduler')}
              >
                <span className="mr-2">📅</span>
                Schedule Post
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => onPageChange('compliance')}
              >
                <span className="mr-2">🛡️</span>
                Check Compliance
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upcoming Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockPosts.map((post) => (
              <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <img 
                    src={mockAssets.find(a => a.id === post.asset_id)?.thumbnail} 
                    alt="Post thumbnail"
                    className="w-16 h-16 rounded object-cover"
                  />
                  <div>
                    <p className="font-medium">{post.caption.slice(0, 60)}...</p>
                    <p className="text-sm text-muted-foreground">
                      Scheduled: {new Date(post.publish_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Badge variant={post.status === 'scheduled' ? 'default' : 'secondary'}>
                  {post.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}