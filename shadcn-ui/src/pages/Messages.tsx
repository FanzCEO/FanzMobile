import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Filter, Paperclip, X, Image, FileText, Video, Music } from 'lucide-react';
import { messagesApi } from '@/lib/api/messages';
import { uploadsApi } from '@/lib/api/uploads';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils/date';
import { toast } from '@/components/ui/sonner';
import type { MessageChannel, MessageDirection } from '@/types/message';

interface Attachment {
  file: File;
  preview?: string;
  uploading?: boolean;
  uploaded?: boolean;
  url?: string;
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return Image;
  if (type.startsWith('video/')) return Video;
  if (type.startsWith('audio/')) return Music;
  return FileText;
};

export default function Messages() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
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
      setAttachments([]);
      toast.success('Message sent successfully');
    },
    onError: () => {
      toast.error('Failed to send message');
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
      newAttachments.push({ file, preview });
    }
    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      const updated = [...prev];
      if (updated[index].preview) URL.revokeObjectURL(updated[index].preview!);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;

    // Upload attachments first
    const uploadedUrls: string[] = [];
    for (let i = 0; i < attachments.length; i++) {
      if (!attachments[i].uploaded) {
        setAttachments((prev) => {
          const updated = [...prev];
          updated[i] = { ...updated[i], uploading: true };
          return updated;
        });
        try {
          const result = await uploadsApi.upload(attachments[i].file, 'message');
          uploadedUrls.push(uploadsApi.getFileUrl(result.id));
          setAttachments((prev) => {
            const updated = [...prev];
            updated[i] = { ...updated[i], uploading: false, uploaded: true, url: uploadsApi.getFileUrl(result.id) };
            return updated;
          });
        } catch {
          toast.error(`Failed to upload ${attachments[i].file.name}`);
          setAttachments((prev) => {
            const updated = [...prev];
            updated[i] = { ...updated[i], uploading: false };
            return updated;
          });
          return;
        }
      } else if (attachments[i].url) {
        uploadedUrls.push(attachments[i].url!);
      }
    }

    // Include attachment URLs in message body
    let messageBody = newMessage;
    if (uploadedUrls.length > 0) {
      messageBody += (messageBody ? '\n\n' : '') + 'Attachments:\n' + uploadedUrls.join('\n');
    }

    createMessageMutation.mutate({
      body: messageBody,
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

          {/* Attachment Preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 bg-white/5 rounded-lg">
              {attachments.map((attachment, index) => {
                const FileIcon = getFileIcon(attachment.file.type);
                return (
                  <div
                    key={index}
                    className="relative group flex items-center gap-2 p-2 bg-white/10 rounded-lg"
                  >
                    {attachment.preview ? (
                      <img
                        src={attachment.preview}
                        alt={attachment.file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 flex items-center justify-center bg-primary/20 rounded">
                        <FileIcon className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div className="max-w-[120px]">
                      <p className="text-xs truncate">{attachment.file.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {(attachment.file.size / 1024).toFixed(1)} KB
                        {attachment.uploading && ' - Uploading...'}
                        {attachment.uploaded && ' - Ready'}
                      </p>
                    </div>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv"
                onChange={handleFileSelect}
                className="hidden"
                id="message-attachment"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4 mr-2" />
                Attach
              </Button>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={(!newMessage.trim() && attachments.length === 0) || createMessageMutation.isPending}
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
