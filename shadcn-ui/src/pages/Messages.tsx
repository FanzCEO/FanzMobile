import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Filter } from 'lucide-react';
import { messagesApi } from '@/lib/api/messages';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils/date';
import { toast } from 'sonner';
import type { MessageChannel, MessageDirection } from '@/types/message';

export default function Messages() {
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [composeChannel, setComposeChannel] = useState<MessageChannel>('sms');
  const [filterChannel, setFilterChannel] = useState<MessageChannel | 'all'>('all');
  const [filterDirection, setFilterDirection] = useState<MessageDirection | 'all'>('all');

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', filterChannel, filterDirection],
    queryFn: () =>
      messagesApi.getMessages({
        limit: 100,
        channel: filterChannel === 'all' ? undefined : filterChannel,
        direction: filterDirection === 'all' ? undefined : filterDirection,
      }),
  });

  const createMessageMutation = useMutation({
    mutationFn: messagesApi.createMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'], exact: false });
      setNewMessage('');
      toast.success('Message sent successfully');
    },
    onError: () => {
      toast.error('Failed to send message');
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    createMessageMutation.mutate({
      body: newMessage,
      channel: composeChannel,
      direction: 'outbound',
    });
  };

  const channels: MessageChannel[] = ['sms', 'rm_chat', 'email', 'manual', 'whatsapp'];
  const filterChannels: (MessageChannel | 'all')[] = ['all', ...channels];
  const directions: (MessageDirection | 'all')[] = ['all', 'inbound', 'outbound'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Messages</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Multi-channel conversation management
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center text-xs sm:text-sm text-muted-foreground">
            <Filter className="h-4 w-4 mr-1" />
            Filters
          </span>
          {filterChannels.map((channel) => (
            <Button
              key={channel}
              variant={filterChannel === channel ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterChannel(channel)}
              className={`text-xs sm:text-sm ${filterChannel === channel ? 'gradient-primary' : ''}`}
            >
              {channel === 'all' ? 'All' : channel.toUpperCase()}
            </Button>
          ))}
          {directions.map((dir) => (
            <Button
              key={dir}
              variant={filterDirection === dir ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterDirection(dir)}
              className={`text-xs sm:text-sm ${filterDirection === dir ? 'gradient-primary' : ''}`}
            >
              {dir === 'all' ? 'Any Direction' : dir}
            </Button>
          ))}
        </div>
      </div>

      {/* Message Composer */}
      <Card className="glass-panel p-4 sm:p-6">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {channels.map((channel) => (
              <Button
                key={channel}
                variant={composeChannel === channel ? 'default' : 'outline'}
                size="sm"
                onClick={() => setComposeChannel(channel)}
                className={`text-xs sm:text-sm ${composeChannel === channel ? 'gradient-primary' : ''}`}
              >
                {channel.toUpperCase()}
              </Button>
            ))}
          </div>
          <Textarea
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || createMessageMutation.isPending}
              className="gradient-primary"
            >
              <Send className="h-4 w-4 mr-2" />
              {createMessageMutation.isPending ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Messages List */}
      <Card className="glass-panel p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold mb-4">All Messages</h2>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <img
              src="/images/photo1765322091.jpg"
              alt="No messages"
              className="w-40 h-40 mx-auto mb-4 opacity-50"
            />
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Send your first message to get started
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-4 rounded-lg ${
                  message.direction === 'inbound'
                    ? 'bg-white/5 ml-0 mr-12'
                    : 'gradient-primary ml-12 mr-0'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {message.channel.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {message.direction}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(message.received_at)}
                  </span>
                </div>
                <p className="text-sm mb-3">{message.body}</p>
                {message.ai_processed && message.ai_result && (
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-white/10">
                    {message.ai_result.contact_name && (
                      <Badge className="bg-primary/20 text-primary">
                        👤 {message.ai_result.contact_name}
                      </Badge>
                    )}
                    {message.ai_result.meeting_detected && (
                      <Badge className="bg-accent/20 text-accent">📅 Meeting Detected</Badge>
                    )}
                    {message.ai_result.meeting_location && (
                      <Badge className="bg-secondary/20 text-secondary">
                        📍 {message.ai_result.meeting_location}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
