import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { platformManager, messageAutomation, CRMContact, MessageTemplate } from '@/lib/platformConnections';

export default function CRMDashboard() {
  const [contacts] = useState<CRMContact[]>(platformManager.getContacts());
  const [templates] = useState<MessageTemplate[]>(messageAutomation.getTemplates());
  const [selectedContact, setSelectedContact] = useState<CRMContact | null>(null);
  const [messageText, setMessageText] = useState('');

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'whale': return 'bg-purple-600';
      case 'vip': return 'bg-yellow-600';
      case 'premium': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'whale': return '🐋';
      case 'vip': return '👑';
      case 'premium': return '💎';
      default: return '👤';
    }
  };

  const sendMessage = (contactId: string, message: string) => {
    // Simulate sending message
    console.log(`Sending message to ${contactId}: ${message}`);
    setMessageText('');
  };

  const handleUseTemplate = (template: MessageTemplate) => {
    if (selectedContact) {
      const processedMessage = messageAutomation.processMessage(template, {
        username: selectedContact.displayName
      });
      setMessageText(processedMessage);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">CRM & Messaging</h1>
        <Button size="sm">
          + Add Contact
        </Button>
      </div>

      <Tabs defaultValue="contacts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-4">
          {/* Contact Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">247</div>
                <div className="text-xs text-muted-foreground">Total Contacts</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">$12,450</div>
                <div className="text-xs text-muted-foreground">Total Revenue</div>
              </CardContent>
            </Card>
          </div>

          {/* Contact List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Recent Contacts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contacts.map((contact) => (
                <div 
                  key={contact.id} 
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 ${
                    selectedContact?.id === contact.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => setSelectedContact(contact)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {contact.displayName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-sm">{contact.displayName}</p>
                        <span className="text-sm">{getTierIcon(contact.tier)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{contact.username} • {contact.platform}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={`text-xs ${getTierColor(contact.tier)}`}>
                          {contact.tier}
                        </Badge>
                        <span className="text-xs text-green-600">
                          ${contact.totalSpent}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(contact.lastInteraction).toLocaleDateString()}
                    </p>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${
                        contact.automationStatus === 'active' ? 'bg-green-100 text-green-800' : ''
                      }`}
                    >
                      {contact.automationStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          {selectedContact ? (
            <>
              {/* Selected Contact Header */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {selectedContact.displayName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{selectedContact.displayName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedContact.username} • {selectedContact.platform}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={`text-xs ${getTierColor(selectedContact.tier)}`}>
                          {getTierIcon(selectedContact.tier)} {selectedContact.tier}
                        </Badge>
                        <span className="text-xs text-green-600">
                          ${selectedContact.totalSpent} spent
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Message Templates */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Quick Templates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {templates.slice(0, 3).map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <span className="mr-2">📝</span>
                      {template.name}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Message Composer */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Send Message</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder="Type your message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    rows={4}
                  />
                  <div className="flex space-x-2">
                    <Button 
                      className="flex-1"
                      onClick={() => sendMessage(selectedContact.id, messageText)}
                      disabled={!messageText.trim()}
                    >
                      Send Message
                    </Button>
                    <Button variant="outline" size="sm">
                      📎 Attach
                    </Button>
                    <Button variant="outline" size="sm">
                      ⏰ Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Alert>
              <AlertDescription className="text-center">
                Select a contact from the Contacts tab to start messaging
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          {/* Automation Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">1,247</div>
                <div className="text-xs text-muted-foreground">Messages Sent</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">78.5%</div>
                <div className="text-xs text-muted-foreground">Response Rate</div>
              </CardContent>
            </Card>
          </div>

          {/* Active Bots */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">AI Marketing Bots</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {platformManager.getBots().map((bot) => (
                <div key={bot.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white">
                      🤖
                    </div>
                    <div>
                      <p className="font-medium text-sm">{bot.name}</p>
                      <p className="text-xs text-muted-foreground">{bot.platform}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          📤 {bot.messagesSent} sent
                        </span>
                        <span className="text-xs text-green-600">
                          📈 {bot.responseRate}% response
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Badge className={bot.isActive ? 'bg-green-600' : 'bg-gray-600'}>
                    {bot.isActive ? 'Active' : 'Paused'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Automation Rules */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Automation Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Welcome New Followers</p>
                    <p className="text-xs text-muted-foreground">Send welcome message to new followers</p>
                  </div>
                  <Badge className="bg-green-600">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Tip Thank You</p>
                    <p className="text-xs text-muted-foreground">Auto-thank users who send tips</p>
                  </div>
                  <Badge className="bg-green-600">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Premium Upsell</p>
                    <p className="text-xs text-muted-foreground">Promote premium content to engaged users</p>
                  </div>
                  <Badge className="bg-gray-600">Paused</Badge>
                </div>
              </div>
              
              <Button variant="outline" className="w-full">
                + Add New Rule
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Analytics Overview */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">89.2%</div>
                <div className="text-xs text-muted-foreground">Message Open Rate</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">$2,847</div>
                <div className="text-xs text-muted-foreground">Revenue from Messages</div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Welcome Messages</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-green-600">+12.5%</span>
                    <Badge variant="secondary">247 sent</Badge>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Upsell Messages</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-green-600">+8.7%</span>
                    <Badge variant="secondary">89 sent</Badge>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Retention Messages</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-red-600">-2.1%</span>
                    <Badge variant="secondary">156 sent</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}