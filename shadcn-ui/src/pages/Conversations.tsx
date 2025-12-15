import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Phone, Video, MoreVertical, Search, Plus, ArrowLeft, MessageSquare } from 'lucide-react';
import { messagesApi } from '@/lib/api/messages';
import { contactsApi } from '@/lib/api/contacts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatRelativeTime } from '@/lib/utils/date';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';
import type { Contact } from '@/types/contact';
import type { Message } from '@/types/message';

interface Conversation {
  contact: Contact;
  lastMessage: Message | null;
  unreadCount: number;
}

export default function Conversations() {
  const queryClient = useQueryClient();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactsApi.getContacts({ limit: 100 }),
  });

  const { data: allMessages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => messagesApi.getMessages({ limit: 500 }),
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });

  // Group messages by contact
  const conversations: Conversation[] = contacts.map((contact) => {
    const contactMessages = allMessages.filter((m) => m.contact_id === contact.id);
    const lastMessage = contactMessages[0] || null;
    return {
      contact,
      lastMessage,
      unreadCount: contactMessages.filter((m) => m.direction === 'inbound' && !m.ai_processed).length,
    };
  }).sort((a, b) => {
    if (!a.lastMessage) return 1;
    if (!b.lastMessage) return -1;
    return new Date(b.lastMessage.received_at).getTime() - new Date(a.lastMessage.received_at).getTime();
  });

  // Get messages for selected contact
  const selectedMessages = selectedContact
    ? allMessages.filter((m) => m.contact_id === selectedContact.id).reverse()
    : [];

  const sendMessageMutation = useMutation({
    mutationFn: async (body: string) => {
      // First create the message in the database
      const message = await messagesApi.createMessage({
        body,
        channel: 'sms',
        direction: 'outbound',
        contact_id: selectedContact?.id,
      });

      // Then try to send via Twilio if configured
      try {
        await apiClient.post('/api/integrations/twilio/send', {
          to: selectedContact?.phone_number,
          body,
          message: body,
        });
      } catch (e) {
        console.warn('Twilio not configured, message saved locally');
      }

      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setNewMessage('');
    },
    onError: () => {
      toast.error('Failed to send message');
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedContact) return;
    sendMessageMutation.mutate(newMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedMessages]);

  const filteredConversations = conversations.filter((conv) =>
    conv.contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.contact.phone_number?.includes(searchQuery)
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex">
      {/* Conversations List */}
      <div
        className={cn(
          'w-full md:w-80 lg:w-96 border-r border-white/10 flex flex-col',
          selectedContact && 'hidden md:flex'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Messages</h1>
            <Button size="sm" variant="ghost">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No conversations yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add contacts to start messaging
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.contact.id}
                onClick={() => setSelectedContact(conv.contact)}
                className={cn(
                  'flex items-center gap-3 p-4 cursor-pointer hover:bg-white/5 transition-colors border-b border-white/5',
                  selectedContact?.id === conv.contact.id && 'bg-white/10'
                )}
              >
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                    {conv.contact.name?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium truncate">
                      {conv.contact.name || conv.contact.phone_number || 'Unknown'}
                    </span>
                    {conv.lastMessage && (
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(conv.lastMessage.received_at)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.lastMessage?.body || 'No messages yet'}
                    </p>
                    {conv.unreadCount > 0 && (
                      <Badge className="bg-primary text-white ml-2">
                        {conv.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div
        className={cn(
          'flex-1 flex flex-col',
          !selectedContact && 'hidden md:flex'
        )}
      >
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setSelectedContact(null)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                    {selectedContact.name?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-bold">
                    {selectedContact.name || selectedContact.phone_number || 'Unknown'}
                  </h2>
                  {selectedContact.phone_number && (
                    <p className="text-xs text-muted-foreground">{selectedContact.phone_number}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Phone className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                    <p className="text-muted-foreground">No messages yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Send a message to start the conversation
                    </p>
                  </div>
                </div>
              ) : (
                selectedMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex',
                      message.direction === 'outbound' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[75%] rounded-2xl px-4 py-2',
                        message.direction === 'outbound'
                          ? 'bg-primary text-white rounded-br-md'
                          : 'bg-white/10 rounded-bl-md'
                      )}
                    >
                      <p className="text-sm">{message.body}</p>
                      <div className="flex items-center justify-end gap-2 mt-1">
                        <span className="text-[10px] opacity-60">
                          {formatRelativeTime(message.received_at)}
                        </span>
                        {message.direction === 'outbound' && (
                          <span className="text-[10px] opacity-60">
                            {message.ai_processed ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="gradient-primary"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-20 w-20 mx-auto mb-4 text-muted-foreground opacity-30" />
              <h2 className="text-xl font-bold mb-2">Welcome to Messages</h2>
              <p className="text-muted-foreground">
                Select a conversation to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
