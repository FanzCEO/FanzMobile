import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { socialChannels } from '@/lib/mockData';

interface MobileSchedulerProps {
  onPageChange: (page: string) => void;
}

export default function MobileScheduler({ onPageChange }: MobileSchedulerProps) {
  const [activeTab, setActiveTab] = useState<'schedule' | 'posts'>('posts');
  
  const scheduledPosts = [
    {
      id: '1',
      content: '🔥 New beach workout session is live! Check out my latest fitness routine...',
      time: '6:00 PM Today',
      platforms: ['BoyFanz', 'Twitter'],
      status: 'scheduled'
    },
    {
      id: '2',
      content: '✨ Amazing collaboration content coming tomorrow! Stay tuned...',
      time: '8:00 PM Tomorrow',
      platforms: ['GirlFanz', 'Instagram'],
      status: 'scheduled'
    },
    {
      id: '3',
      content: '💪 Workout complete! Feeling stronger every day. #fitness #motivation',
      time: '12:00 PM Tomorrow',
      platforms: ['BoyFanz', 'Twitter', 'Reddit'],
      status: 'scheduled'
    }
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => onPageChange('dashboard')}>
          ← Back
        </Button>
        <h1 className="text-lg font-semibold">Scheduler</h1>
        <Button variant="ghost" size="sm">
          ⚙️
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-muted rounded-lg p-1">
        <Button
          variant={activeTab === 'posts' ? 'default' : 'ghost'}
          size="sm"
          className="flex-1"
          onClick={() => setActiveTab('posts')}
        >
          Scheduled Posts
        </Button>
        <Button
          variant={activeTab === 'schedule' ? 'default' : 'ghost'}
          size="sm"
          className="flex-1"
          onClick={() => setActiveTab('schedule')}
        >
          New Post
        </Button>
      </div>

      {/* Scheduled Posts Tab */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Upcoming Posts ({scheduledPosts.length})</h2>
            <Button size="sm" variant="outline">
              📅 Calendar
            </Button>
          </div>

          <div className="space-y-3">
            {scheduledPosts.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <p className="text-sm flex-1 pr-2">{post.content}</p>
                      <Button variant="ghost" size="sm">
                        ⋯
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium">{post.time}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {post.platforms.map((platform) => (
                            <Badge key={platform} variant="secondary" className="text-xs">
                              {platform}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge className="bg-blue-600">
                        {post.status}
                      </Badge>
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Post Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* New Post Tab */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Create Scheduled Post</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Textarea 
                  placeholder="What's on your mind? Use hashtags and mentions..."
                  rows={4}
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-muted-foreground">0/280 characters</span>
                  <Button variant="ghost" size="sm" className="text-xs">
                    🤖 AI Help
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Select Platforms</h4>
                {socialChannels.slice(0, 4).map((channel) => (
                  <div key={channel.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span>{channel.icon}</span>
                      <span className="text-sm">{channel.name}</span>
                    </div>
                    <Switch defaultChecked={channel.connected} disabled={!channel.connected} />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Schedule Time</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="date" />
                  <Input type="time" defaultValue="18:00" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button className="w-full">
              Schedule Post
            </Button>
            <Button variant="outline" className="w-full">
              Save as Draft
            </Button>
          </div>

          {/* AI Suggestions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2">
                <span>🤖</span>
                <span>AI Suggestions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h5 className="text-xs font-medium text-muted-foreground mb-2">BEST TIMES</h5>
                <div className="flex space-x-2">
                  <Badge variant="outline" className="text-xs">6-8 PM</Badge>
                  <Badge variant="outline" className="text-xs">12-2 PM</Badge>
                </div>
              </div>
              
              <div>
                <h5 className="text-xs font-medium text-muted-foreground mb-2">TRENDING HASHTAGS</h5>
                <div className="flex flex-wrap gap-1">
                  {['#content', '#exclusive', '#newpost', '#creator'].map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs cursor-pointer">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}