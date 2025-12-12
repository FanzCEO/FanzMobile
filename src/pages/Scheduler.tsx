import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { mockAssets, mockPosts, socialChannels } from '@/lib/mockData';

interface SchedulerProps {
  onPageChange: (page: string) => void;
}

export default function Scheduler({ onPageChange }: SchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [postData, setPostData] = useState({
    caption: '',
    publish_at: '',
    channels: {} as Record<string, boolean>
  });

  const scheduledPosts = [
    ...mockPosts,
    {
      id: '3',
      asset_id: '1',
      caption: '🌅 Good morning! Starting the day with some positive energy. What are your plans for today?',
      publish_at: '2024-10-30T09:00:00Z',
      status: 'scheduled' as const,
      created_at: '2024-10-29T10:00:00Z'
    },
    {
      id: '4',
      asset_id: '2',
      caption: '💪 Workout complete! Feeling stronger every day. Remember, consistency is key! #fitness #motivation',
      publish_at: '2024-10-30T12:00:00Z',
      status: 'scheduled' as const,
      created_at: '2024-10-29T11:00:00Z'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-600';
      case 'scheduled': return 'bg-blue-600';
      case 'draft': return 'bg-yellow-600';
      case 'failed': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Social Media Scheduler</h1>
          <p className="text-muted-foreground">Schedule and manage cross-platform content distribution</p>
        </div>
        <Button onClick={() => onPageChange('upload')}>
          <span className="mr-2">📤</span>
          Upload Content
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Create New Post */}
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Post</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Asset Selection */}
              <div className="space-y-2">
                <Label>Select Content</Label>
                <div className="grid grid-cols-2 gap-2">
                  {mockAssets.filter(asset => asset.status === 'ready').map((asset) => (
                    <div
                      key={asset.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedAsset === asset.id ? 'border-primary bg-primary/10' : 'hover:border-muted-foreground'
                      }`}
                      onClick={() => setSelectedAsset(asset.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <img 
                          src={asset.thumbnail} 
                          alt={asset.title}
                          className="w-12 h-12 rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{asset.title}</p>
                          <p className="text-xs text-muted-foreground">{asset.mime}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Caption */}
              <div className="space-y-2">
                <Label htmlFor="caption">Caption</Label>
                <Textarea
                  id="caption"
                  value={postData.caption}
                  onChange={(e) => setPostData({...postData, caption: e.target.value})}
                  placeholder="Write your post caption... Use hashtags and mentions to increase engagement!"
                  rows={4}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{postData.caption.length}/280 characters</span>
                  <Button variant="ghost" size="sm">
                    🤖 AI Suggestions
                  </Button>
                </div>
              </div>

              {/* Social Channels */}
              <div className="space-y-2">
                <Label>Social Channels</Label>
                <div className="grid grid-cols-2 gap-3">
                  {socialChannels.map((channel) => (
                    <div key={channel.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{channel.icon}</span>
                        <span className="font-medium">{channel.name}</span>
                      </div>
                      <Switch
                        checked={postData.channels[channel.name] || false}
                        onCheckedChange={(checked) => 
                          setPostData({
                            ...postData, 
                            channels: {...postData.channels, [channel.name]: checked}
                          })
                        }
                        disabled={!channel.connected}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Schedule */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Publish Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        📅 {selectedDate ? selectedDate.toLocaleDateString() : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="time">Publish Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={postData.publish_at}
                    onChange={(e) => setPostData({...postData, publish_at: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" className="flex-1">
                  Save Draft
                </Button>
                <Button className="flex-1">
                  Schedule Post
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🤖</span>
                <span>AI Content Suggestions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Caption Ideas</h4>
                  <div className="space-y-2">
                    {[
                      "🔥 New content alert! This one's special...",
                      "✨ Behind the scenes magic happening here",
                      "💫 Creating something amazing for you all"
                    ].map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="w-full text-left justify-start h-auto p-2"
                        onClick={() => setPostData({...postData, caption: suggestion})}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Hashtag Suggestions</h4>
                  <div className="flex flex-wrap gap-1">
                    {['#content', '#exclusive', '#newpost', '#creator', '#fanfavorite', '#trending'].map((tag) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scheduled Posts */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Posts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {scheduledPosts
                .filter(post => post.status === 'scheduled')
                .sort((a, b) => new Date(a.publish_at).getTime() - new Date(b.publish_at).getTime())
                .map((post) => {
                  const asset = mockAssets.find(a => a.id === post.asset_id);
                  return (
                    <div key={post.id} className="space-y-2 p-3 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <img 
                          src={asset?.thumbnail} 
                          alt={asset?.title}
                          className="w-8 h-8 rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{post.caption.slice(0, 40)}...</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(post.publish_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <Badge className={getStatusColor(post.status)}>
                          {post.status}
                        </Badge>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">Edit</Button>
                          <Button variant="ghost" size="sm">Delete</Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </CardContent>
          </Card>

          {/* Analytics Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Best posting time</span>
                  <span className="text-sm font-medium">6-8 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Top performing hashtags</span>
                  <span className="text-sm font-medium">#exclusive #content</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Avg engagement rate</span>
                  <span className="text-sm font-medium">8.4%</span>
                </div>
              </div>
              
              <Button variant="outline" size="sm" className="w-full">
                View Full Analytics
              </Button>
            </CardContent>
          </Card>

          {/* Channel Status */}
          <Card>
            <CardHeader>
              <CardTitle>Channel Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {socialChannels.map((channel) => (
                <div key={channel.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span>{channel.icon}</span>
                    <span className="text-sm font-medium">{channel.name}</span>
                  </div>
                  <Badge variant={channel.connected ? 'default' : 'secondary'}>
                    {channel.connected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
              ))}
              
              <Button variant="outline" size="sm" className="w-full mt-4">
                Manage Connections
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}