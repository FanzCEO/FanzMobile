import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { platformManager } from '@/lib/platformConnections';

export default function AnalyticsReporting() {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const analyticsData = platformManager.getAnalyticsData();
  const profiles = platformManager.getConnectedProfiles();

  const overviewStats = {
    totalRevenue: '$12,847.25',
    totalViews: '247.3K',
    totalFollowers: '29.1K',
    engagementRate: '8.7%',
    conversionRate: '3.2%',
    avgRevenuePerUser: '$44.20'
  };

  const platformPerformance = [
    {
      platform: 'BoyFanz',
      profiles: 2,
      revenue: '$10,550.75',
      growth: '+12.5%',
      color: 'bg-blue-600'
    },
    {
      platform: 'GirlFanz',
      profiles: 1,
      revenue: '$5,670.75',
      growth: '+8.7%',
      color: 'bg-pink-600'
    },
    {
      platform: 'PupFanz',
      profiles: 1,
      revenue: '$890.00',
      growth: '-2.1%',
      color: 'bg-purple-600'
    }
  ];

  const contentPerformance = [
    {
      type: 'Video Content',
      count: 47,
      avgViews: '5.2K',
      avgRevenue: '$127.50',
      engagement: '9.2%'
    },
    {
      type: 'Photo Content',
      count: 89,
      avgViews: '3.1K',
      avgRevenue: '$67.25',
      engagement: '7.8%'
    },
    {
      type: 'Live Streams',
      count: 12,
      avgViews: '8.7K',
      avgRevenue: '$247.80',
      engagement: '12.4%'
    }
  ];

  const audienceInsights = [
    { demographic: 'Age 18-24', percentage: 32, color: 'bg-blue-500' },
    { demographic: 'Age 25-34', percentage: 45, color: 'bg-green-500' },
    { demographic: 'Age 35-44', percentage: 18, color: 'bg-yellow-500' },
    { demographic: 'Age 45+', percentage: 5, color: 'bg-red-500' }
  ];

  const revenueBreakdown = [
    { source: 'Tips & Donations', amount: '$7,247.50', percentage: 56 },
    { source: 'Premium Subscriptions', amount: '$3,890.25', percentage: 30 },
    { source: 'Pay-Per-View', amount: '$1,456.75', percentage: 11 },
    { source: 'Merchandise', amount: '$252.75', percentage: 3 }
  ];

  const marketingMetrics = {
    messagesSent: 1247,
    responseRate: 78.5,
    conversionRate: 12.3,
    revenueFromMessages: '$2,847.50',
    automationSavings: '$4,200'
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Analytics & Reporting</h1>
        <div className="flex space-x-2">
          {['24h', '7d', '30d', '90d'].map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period}
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{overviewStats.totalRevenue}</div>
                <div className="text-xs text-muted-foreground">Total Revenue</div>
                <div className="text-xs text-green-600 mt-1">+15.2% vs last period</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{overviewStats.totalViews}</div>
                <div className="text-xs text-muted-foreground">Total Views</div>
                <div className="text-xs text-blue-600 mt-1">+8.7% vs last period</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{overviewStats.totalFollowers}</div>
                <div className="text-xs text-muted-foreground">Total Followers</div>
                <div className="text-xs text-purple-600 mt-1">+12.3% vs last period</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{overviewStats.engagementRate}</div>
                <div className="text-xs text-muted-foreground">Engagement Rate</div>
                <div className="text-xs text-orange-600 mt-1">+2.1% vs last period</div>
              </CardContent>
            </Card>
          </div>

          {/* Platform Performance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Platform Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {platformPerformance.map((platform, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${platform.color}`} />
                    <div>
                      <p className="font-medium text-sm">{platform.platform}</p>
                      <p className="text-xs text-muted-foreground">{platform.profiles} profiles</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{platform.revenue}</p>
                    <p className={`text-xs ${platform.growth.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {platform.growth}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Revenue Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Revenue Sources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {revenueBreakdown.map((source, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{source.source}</span>
                    <span className="text-sm font-semibold">{source.amount}</span>
                  </div>
                  <Progress value={source.percentage} className="h-2" />
                  <div className="text-xs text-muted-foreground text-right">
                    {source.percentage}% of total revenue
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          {/* Content Performance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Content Performance by Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contentPerformance.map((content, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-sm">{content.type}</h4>
                    <Badge variant="secondary">{content.count} posts</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="text-center">
                      <div className="font-semibold">{content.avgViews}</div>
                      <div className="text-muted-foreground">Avg Views</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-green-600">{content.avgRevenue}</div>
                      <div className="text-muted-foreground">Avg Revenue</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-blue-600">{content.engagement}</div>
                      <div className="text-muted-foreground">Engagement</div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Top Performing Content */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Top Performing Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { title: 'Morning Workout Routine', views: '15.2K', revenue: '$347.50', engagement: '12.4%' },
                { title: 'Behind the Scenes', views: '12.8K', revenue: '$289.25', engagement: '10.8%' },
                { title: 'Q&A Session', views: '9.7K', revenue: '$198.75', engagement: '9.2%' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-xs text-muted-foreground">👁️ {item.views}</span>
                      <span className="text-xs text-green-600">💰 {item.revenue}</span>
                      <span className="text-xs text-blue-600">❤️ {item.engagement}</span>
                    </div>
                  </div>
                  <Badge className="bg-gold-100 text-gold-800">
                    #{index + 1}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Content Protection Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Content Protection Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">47</div>
                  <div className="text-xs text-muted-foreground">Protected Content</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">12</div>
                  <div className="text-xs text-muted-foreground">DMCA Takedowns</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">98.7%</div>
                  <div className="text-xs text-muted-foreground">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">2.3h</div>
                  <div className="text-xs text-muted-foreground">Avg Response</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audience" className="space-y-4">
          {/* Audience Demographics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Audience Demographics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {audienceInsights.map((demo, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{demo.demographic}</span>
                    <span className="text-sm font-semibold">{demo.percentage}%</span>
                  </div>
                  <Progress value={demo.percentage} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Geographic Distribution */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Geographic Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { country: 'United States', percentage: 45, flag: '🇺🇸' },
                { country: 'United Kingdom', percentage: 18, flag: '🇬🇧' },
                { country: 'Canada', percentage: 12, flag: '🇨🇦' },
                { country: 'Australia', percentage: 8, flag: '🇦🇺' },
                { country: 'Other', percentage: 17, flag: '🌍' }
              ].map((geo, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{geo.flag}</span>
                    <span className="text-sm font-medium">{geo.country}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={geo.percentage} className="h-2 w-16" />
                    <span className="text-sm font-semibold w-8">{geo.percentage}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Engagement Patterns */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Peak Engagement Times</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-blue-600">8-10 PM</div>
                  <div className="text-xs text-muted-foreground">Peak Hours</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-purple-600">Fri-Sun</div>
                  <div className="text-xs text-muted-foreground">Peak Days</div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Hourly Engagement</p>
                {[
                  { time: '6-9 AM', engagement: 25 },
                  { time: '12-2 PM', engagement: 45 },
                  { time: '6-8 PM', engagement: 70 },
                  { time: '8-11 PM', engagement: 95 }
                ].map((slot, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-xs">{slot.time}</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={slot.engagement} className="h-1 w-20" />
                      <span className="text-xs w-8">{slot.engagement}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketing" className="space-y-4">
          {/* Marketing Performance */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{marketingMetrics.messagesSent}</div>
                <div className="text-xs text-muted-foreground">Messages Sent</div>
                <div className="text-xs text-purple-600 mt-1">+23.4% this period</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{marketingMetrics.responseRate}%</div>
                <div className="text-xs text-muted-foreground">Response Rate</div>
                <div className="text-xs text-green-600 mt-1">+5.2% vs average</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{marketingMetrics.conversionRate}%</div>
                <div className="text-xs text-muted-foreground">Conversion Rate</div>
                <div className="text-xs text-blue-600 mt-1">+2.1% vs last period</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{marketingMetrics.revenueFromMessages}</div>
                <div className="text-xs text-muted-foreground">Message Revenue</div>
                <div className="text-xs text-orange-600 mt-1">+18.7% vs last period</div>
              </CardContent>
            </Card>
          </div>

          {/* Campaign Performance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Campaign Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: 'Welcome Series', sent: 247, opened: 89.2, clicked: 34.5, revenue: '$1,247' },
                { name: 'Premium Upsell', sent: 89, opened: 67.4, clicked: 23.6, revenue: '$892' },
                { name: 'Retention Campaign', sent: 156, opened: 78.8, clicked: 18.2, revenue: '$456' }
              ].map((campaign, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-sm">{campaign.name}</h4>
                    <Badge variant="secondary">{campaign.sent} sent</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="text-center">
                      <div className="font-semibold">{campaign.opened}%</div>
                      <div className="text-muted-foreground">Open Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{campaign.clicked}%</div>
                      <div className="text-muted-foreground">Click Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-green-600">{campaign.revenue}</div>
                      <div className="text-muted-foreground">Revenue</div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Automation Savings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Automation Impact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-green-600">{marketingMetrics.automationSavings}</div>
                  <div className="text-xs text-muted-foreground">Time Savings Value</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-blue-600">24/7</div>
                  <div className="text-xs text-muted-foreground">Active Monitoring</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Manual vs Automated Response Time</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Manual: 2-4 hours</span>
                    <span>Automated: 30 seconds</span>
                  </div>
                  <Progress value={95} className="h-2" />
                  <div className="text-xs text-green-600 text-center">95% faster response time</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}