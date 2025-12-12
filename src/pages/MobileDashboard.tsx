import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { mockUser, mockAssets, mockJobs, platforms } from '@/lib/mockData';
import ForensicProtection from '@/components/ForensicProtection';

interface MobileDashboardProps {
  onPageChange: (page: string) => void;
}

export default function MobileDashboard({ onPageChange }: MobileDashboardProps) {
  const activeJobs = mockJobs.filter(job => job.status === 'processing');
  const todayEarnings = "$247.50";
  const newFollowers = "+127";
  const protectedContent = "47";
  const dmcaTakedowns = "12";

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src="/avatars/01.png" alt="@alexcreator" />
            <AvatarFallback>AC</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-lg font-bold">Welcome back!</h1>
            <p className="text-sm text-muted-foreground">{mockUser.handle}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={`${
            mockUser.platform === 'BoyFanz' ? 'bg-blue-600' :
            mockUser.platform === 'GirlFanz' ? 'bg-pink-600' : 'bg-purple-600'
          }`}>
            {mockUser.platform}
          </Badge>
          <Button variant="ghost" size="sm">
            🔔
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{todayEarnings}</div>
            <div className="text-xs text-muted-foreground">Today's Earnings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{newFollowers}</div>
            <div className="text-xs text-muted-foreground">New Followers</div>
          </CardContent>
        </Card>
      </div>

      {/* Protection Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{protectedContent}</div>
            <div className="text-xs text-muted-foreground">Protected Content</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{dmcaTakedowns}</div>
            <div className="text-xs text-muted-foreground">DMCA Takedowns</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Upload */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Professional Upload</h3>
              <p className="text-sm opacity-90">AI enhancement + forensic protection</p>
            </div>
            <Button 
              onClick={() => onPageChange('upload')} 
              variant="secondary"
              size="sm"
              className="bg-white text-primary hover:bg-gray-100"
            >
              🎬 Upload
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Forensic Protection Status */}
      <ForensicProtection />

      {/* Processing Status */}
      {activeJobs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center space-x-2">
              <span>⚙️</span>
              <span>Media Processing</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeJobs.map((job) => (
              <div key={job.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{job.type.replace('_', ' ')}</span>
                  <span>{job.progress}%</span>
                </div>
                <Progress value={job.progress} className="h-2" />
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span>🔐</span>
                  <span>Forensic signature applied</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Content */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">Recent Content</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs">View All</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockAssets.slice(0, 2).map((asset) => (
            <div key={asset.id} className="flex items-center space-x-3">
              <img 
                src={asset.thumbnail} 
                alt={asset.title}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{asset.title}</p>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${
                      asset.status === 'ready' ? 'bg-green-100 text-green-800' :
                      asset.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {asset.status}
                  </Badge>
                  <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                    🛡️ Protected
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(asset.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Platform Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Platform Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {platforms.map((platform) => (
            <div key={platform.name} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${platform.color}`} />
                <span className="text-sm font-medium">{platform.name}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{platform.users}</div>
                <div className="text-xs text-muted-foreground">followers</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button 
          variant="outline" 
          className="h-16 flex flex-col space-y-1"
          onClick={() => onPageChange('scheduler')}
        >
          <span className="text-lg">📅</span>
          <span className="text-xs">Schedule Post</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-16 flex flex-col space-y-1"
          onClick={() => onPageChange('compliance')}
        >
          <span className="text-lg">🛡️</span>
          <span className="text-xs">Protection Hub</span>
        </Button>
      </div>

      {/* FANZ Signature Footer */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">
            🔐 Protected by <strong>FANZ Signature™</strong>
          </p>
          <p className="text-xs text-muted-foreground">
            Advanced content protection • Similar to MojoSign
          </p>
        </CardContent>
      </Card>
    </div>
  );
}