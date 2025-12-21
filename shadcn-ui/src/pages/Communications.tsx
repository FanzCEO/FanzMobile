import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Radio, Send, Phone, MessageSquare, Mic, MicOff, AlertTriangle, Bot, Plug, MapPin, Activity, Mail } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { threadsApi } from '@/lib/api/threads';
import { communicationsApi } from '@/lib/api/communications';
import type { Thread, ThreadEvent } from '@/types/thread';
import { toast } from '@/components/ui/sonner';
import { useRealtime } from '@/lib/realtime';
import { useAuth } from '@/lib/hooks/useAuth';
import { livekitApi } from '@/lib/livekit';
import { useEffect } from 'react';

// Empty default - threads come from API
const EMPTY_THREADS: Thread[] = [];

const CONNECTORS = [
  { id: 'ptt', label: 'CB / PTT (LiveKit)', status: 'required', desc: 'WebRTC SFU + TURN', icon: Radio },
  { id: 'sms', label: 'SMS/MMS (Telnyx)', status: 'connected', desc: 'Primary carrier', icon: MessageSquare },
  { id: 'whatsapp', label: 'WhatsApp Business', status: 'pending', desc: 'Meta Cloud API', icon: Phone },
  { id: 'telegram', label: 'Telegram Bot', status: 'connected', desc: 'Bot API', icon: Send },
  { id: 'email', label: 'Email (IMAP/SMTP)', status: 'pending', desc: 'Gmail/API or custom', icon: Mail },
  { id: 'webhook', label: 'Webhooks / Zapier', status: 'beta', desc: 'Outbound events', icon: Plug },
];

export default function Communications() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedThreadId, setSelectedThreadId] = useState<string>('thread-1');
  const [reply, setReply] = useState('');
  const [pttActive, setPttActive] = useState(false);
  const [pttReady, setPttReady] = useState(false);
  const [pttError, setPttError] = useState<string | null>(null);
  const [pttRoom, setPttRoom] = useState<any>(null);
  const [pttTrack, setPttTrack] = useState<any>(null);

  // Communication controls state
  const [smsRecipient, setSmsRecipient] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [callRecipient, setCallRecipient] = useState('');
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [showSmsDialog, setShowSmsDialog] = useState(false);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  const { data: threads = EMPTY_THREADS } = useQuery({
    queryKey: ['threads'],
    queryFn: () => threadsApi.list({ limit: 50 }),
    retry: false,
    staleTime: 15_000,
  });
  const hasThreads = threads.length > 0;

  const selectedThread = useMemo(() => {
    return threads.find((t) => t.id === selectedThreadId) || threads[0] || null;
  }, [threads, selectedThreadId]);

  const { data: events = selectedThread?.events || [] } = useQuery<ThreadEvent[]>({
    queryKey: ['thread-events', selectedThread?.id],
    queryFn: () => threadsApi.getEvents(selectedThread!.id),
    enabled: !!selectedThread?.id,
    retry: false,
  });

  // Fetch LiveKit config from backend
  const { data: livekitConfig } = useQuery({
    queryKey: ['livekit-config'],
    queryFn: () => livekitApi.getConfig(),
    retry: false,
    staleTime: 60_000, // Cache for 1 minute
  });
  const livekitConfigured = livekitConfig?.configured && !!livekitConfig?.url;
  const wsBase = import.meta.env.VITE_WS_URL as string | undefined;
  const userId = user?.id || user?.email || 'anonymous';
  const roomId = selectedThread?.id || 'global';
  const wsUrl = wsBase ? `${wsBase.replace(/\/$/, '')}/${roomId}/${encodeURIComponent(userId)}` : undefined;

  const { status: wsStatus } = useRealtime({
    url: wsUrl,
    onMessage: (payload) => {
      // Expecting shape { thread_id, event }
      const threadId = (payload as any)?.thread_id;
      const event = (payload as any)?.event as ThreadEvent | undefined;
      if (!threadId || !event) return;

      // Update events cache
      queryClient.setQueryData<ThreadEvent[]>(['thread-events', threadId], (prev) => {
        const existing = prev || [];
        // Avoid dupes by id
        if (existing.some((e) => e.id === event.id)) return existing;
        return [...existing, event];
      });

      // Update thread list summaries
      queryClient.setQueryData<Thread[]>(['threads'], (prev) => {
        const list = prev && prev.length > 0 ? [...prev] : [];
        const idx = list.findIndex((t) => t.id === threadId);
        const updatedLast = event.body || event.type;
        if (idx >= 0) {
          list[idx] = {
            ...list[idx],
            last: updatedLast,
            unread: true,
          };
          return list;
        }
        // If thread not found, add minimal
        return [
          ...list,
          {
            id: threadId,
            title: `Thread ${threadId}`,
            channel: event.channel || 'in_app',
            last: updatedLast,
            unread: true,
          },
        ];
      });
    },
  });

  const cleanupPtt = async () => {
    try {
      if (pttTrack) {
        await pttTrack.stop?.();
      }
      if (pttRoom) {
        await pttRoom.disconnect?.();
      }
    } catch {
      // ignore
    } finally {
      setPttTrack(null);
      setPttRoom(null);
      setPttReady(false);
    }
  };

  const handleJoinPtt = async () => {
    setPttError(null);

    // Check if running in mobile WebView (Capacitor) - must check FIRST
    const isMobileApp = window.location.protocol === 'capacitor:' ||
                        (window as typeof window & { Capacitor?: unknown }).Capacitor !== undefined ||
                        navigator.userAgent.includes('Mobile') && !navigator.userAgent.includes('Safari/');

    if (isMobileApp) {
      setPttError('Voice features coming soon to mobile app');
      toast.info('PTT available on web. Mobile voice coming in next update.');
      return;
    }

    if (!livekitConfigured) {
      setPttError('LiveKit not configured');
      return;
    }
    try {
      const roomName = roomId;
      const identity = userId || 'anonymous';
      const { token, url } = await livekitApi.getToken(roomName, identity);

      // Lazy load livekit-client from CDN for web browsers
      const lk = await import(/* @vite-ignore */ 'https://esm.sh/livekit-client@2.8.2');
      const room = await lk.connect(url, token, {
        autoSubscribe: true,
      });
      const micTrack = await lk.createLocalAudioTrack();
      await room.localParticipant.publishTrack(micTrack);
      await micTrack.mute?.();
      setPttTrack(micTrack);
      setPttRoom(room);
      setPttReady(true);
      toast.success('PTT connected');
    } catch (error: any) {
      console.error('PTT join failed', error?.message || error);
      const errorMsg = error?.message || 'PTT join failed - check microphone permissions';
      setPttError(errorMsg);
      toast.error(errorMsg);
      await cleanupPtt();
    }
  };

  const handleLeavePtt = async () => {
    await cleanupPtt();
    toast.message('PTT disconnected');
  };

  const handlePttDown = async () => {
    if (!pttTrack) return;
    setPttActive(true);
    try {
      await pttTrack.unmute?.();
    } catch {
      /* ignore */
    }
  };

  const handlePttUp = async () => {
    if (!pttTrack) return;
    setPttActive(false);
    try {
      await pttTrack.mute?.();
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    return () => {
      cleanupPtt();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async () => {
    if (!reply.trim()) return;
    if (!selectedThread || !hasThreads) {
      toast.error('No thread available. Create a thread on the backend first.');
      return;
    }
    try {
      await threadsApi.sendMessage(selectedThread.id, reply, (selectedThread.channel as any) || 'in_app');
      setReply('');
      queryClient.invalidateQueries({ queryKey: ['thread-events', selectedThread.id] });
      queryClient.invalidateQueries({ queryKey: ['threads'] });
    } catch (error) {
      toast.error('Send failed');
    }
  };

  const handleSendSMS = async () => {
    if (!smsRecipient.trim() || !smsMessage.trim()) {
      toast.error('Please enter recipient and message');
      return;
    }
    try {
      await communicationsApi.sendSMS({
        to: smsRecipient,
        body: smsMessage,
        thread_id: selectedThread?.id,
      });
      toast.success(`SMS sent to ${smsRecipient}`);
      setSmsRecipient('');
      setSmsMessage('');
      setShowSmsDialog(false);
      queryClient.invalidateQueries({ queryKey: ['thread-events', selectedThread?.id] });
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to send SMS');
    }
  };

  const handleInitiateCall = async () => {
    if (!callRecipient.trim()) {
      toast.error('Please enter recipient phone number');
      return;
    }
    try {
      const result = await communicationsApi.initiateCall({
        to: callRecipient,
        thread_id: selectedThread?.id,
        provider: 'twilio',
      });
      toast.success(`Call initiated to ${callRecipient}`);
      setCallRecipient('');
      setShowCallDialog(false);
      queryClient.invalidateQueries({ queryKey: ['thread-events', selectedThread?.id] });
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to initiate call');
    }
  };

  const handleSendEmail = async () => {
    if (!emailRecipient.trim() || !emailSubject.trim() || !emailBody.trim()) {
      toast.error('Please fill in all email fields');
      return;
    }
    try {
      await communicationsApi.sendEmail({
        to: emailRecipient,
        subject: emailSubject,
        body: emailBody,
        thread_id: selectedThread?.id,
      });
      toast.success(`Email sent to ${emailRecipient}`);
      setEmailRecipient('');
      setEmailSubject('');
      setEmailBody('');
      setShowEmailDialog(false);
      queryClient.invalidateQueries({ queryKey: ['thread-events', selectedThread?.id] });
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to send email');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Comms Control</h1>
          <p className="text-muted-foreground mt-1">
            Unified threads, CB-style push-to-talk, and every channel in one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {livekitConfigured ? 'PTT ready' : 'PTT not configured'}
          </Badge>
          <Badge variant="outline" className="text-xs capitalize">
            WS: {wsStatus}
          </Badge>
          <Badge variant="outline" className="text-xs">All channels unified</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left: Threads list */}
        <Card className="glass-panel p-3 lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">Threads</span>
            </div>
            <Badge variant="secondary" className="text-xs">Live</Badge>
          </div>
          <div className="space-y-2">
            {threads.length === 0 ? (
              <Card className="p-3 bg-white/5 text-sm text-muted-foreground">
                No threads yet. Send a message or create one from the backend to see it here.
              </Card>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThreadId(thread.id)}
                  className={cn(
                    'w-full rounded-lg p-3 text-left border transition-all',
                    selectedThreadId === thread.id
                      ? 'border-primary bg-primary/10'
                      : 'border-white/10 hover:border-white/20'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-sm truncate">{thread.title}</div>
                    <Badge variant="outline" className="text-[10px]">{thread.channel}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{thread.last}</p>
                  {thread.unread && <Badge className="mt-2 text-[10px]">Unread</Badge>}
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Center: Thread view */}
        <Card className="glass-panel p-4 lg:col-span-2 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-bold text-lg">{selectedThread.title}</h3>
            <Badge variant="outline" className="text-xs">{selectedThread.channel}</Badge>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto max-h-[520px] pr-1">
            {events.map((event) => (
              <div
                key={event.id}
                className={cn(
                  'rounded-lg p-3 border',
                  event.direction === 'outbound'
                    ? 'border-primary/30 bg-primary/10'
                    : 'border-white/10 bg-white/5'
                )}
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {event.channel}
                  </Badge>
                  <span>{event.at}</span>
                  {event.meta && <span>• {event.meta}</span>}
                  <span className="capitalize">• {event.type}</span>
                </div>
                <p className="text-sm">{event.body}</p>
              </div>
            ))}
          </div>
          <Separator className="my-3" />
          <div className="space-y-2">
            <Textarea
              placeholder="Type, paste a canned reply, or hold-to-talk…"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={3}
            />
            <div className="flex items-center gap-2 flex-wrap">
              <Button className="gradient-primary" onClick={handleSend} disabled={!reply.trim() || !hasThreads}>
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
              <Button
                variant="outline"
                onMouseDown={handlePttDown}
                onMouseUp={handlePttUp}
                disabled={!pttReady}
              >
                {pttActive ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                {pttReady ? (pttActive ? 'Release to stop' : 'Hold to talk') : 'Join PTT first'}
              </Button>
              <Button variant="outline" className="gap-1">
                <Bot className="h-4 w-4" />
                AI draft
              </Button>
              <Separator orientation="vertical" className="h-8" />
              <Button variant="outline" onClick={() => setShowSmsDialog(true)} className="gap-1">
                <MessageSquare className="h-4 w-4" />
                SMS
              </Button>
              <Button variant="outline" onClick={() => setShowCallDialog(true)} className="gap-1">
                <Phone className="h-4 w-4" />
                Call
              </Button>
              <Button variant="outline" onClick={() => setShowEmailDialog(true)} className="gap-1">
                <Mail className="h-4 w-4" />
                Email
              </Button>
            </div>
          </div>
        </Card>

        {/* Right: PTT + integrations */}
        <div className="space-y-4 lg:col-span-1">
          <Card className="glass-panel p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-primary" />
              <div>
                <h4 className="font-semibold text-sm">CB / PTT Channel</h4>
                <p className="text-xs text-muted-foreground">Live voice for fleets</p>
              </div>
            </div>
              <div className="rounded-lg border border-white/10 p-3 bg-white/5 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Radio className="h-4 w-4 text-primary" />
                    <span>Channel: Fleet Dispatch</span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                  {livekitConfigured ? (pttReady ? 'Connected' : 'Ready') : 'Not set'}
                  </Badge>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    className="w-full gradient-primary"
                    disabled={!livekitConfigured || pttReady}
                    onClick={handleJoinPtt}
                  >
                    {pttReady ? 'Connected' : 'Join PTT'}
                  </Button>
                  {pttReady && (
                    <Button variant="outline" className="w-full" onClick={handleLeavePtt}>
                      Leave PTT
                    </Button>
                  )}
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled={!pttReady}
                    onMouseDown={handlePttDown}
                    onMouseUp={handlePttUp}
                  >
                    {pttActive ? 'Broadcasting…' : 'Hold to Talk'}
                  </Button>
                </div>
                {!livekitConfigured && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-amber-400" />
                    Set VITE_LIVEKIT_URL to enable PTT
                  </p>
                )}
                {pttError && (
                  <p className="text-xs text-destructive mt-2">
                    {pttError}
                  </p>
                )}
              </div>
            <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
              <Badge variant="secondary">Recording</Badge>
              <Badge variant="secondary">Transcription</Badge>
              <Badge variant="secondary">WebRTC + TURN</Badge>
            </div>
          </Card>

          <Card className="glass-panel p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Plug className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-sm">Connectors</h4>
            </div>
            <div className="space-y-2">
              {CONNECTORS.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded-lg border border-white/10">
                  <div className="flex items-center gap-2">
                    <c.icon className="h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium">{c.label}</p>
                      <p className="text-[11px] text-muted-foreground">{c.desc}</p>
                    </div>
                  </div>
                  <Badge variant={c.status === 'connected' ? 'default' : 'outline'} className="text-[10px]">
                    {c.status}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full text-sm" onClick={() => navigate('/integrations')}>Manage integrations</Button>
          </Card>

          <Card className="glass-panel p-4 space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-sm">Dispatch Snapshot</h4>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Online drivers</span>
                <Badge variant="secondary">12</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Open alerts</span>
                <Badge variant="secondary" className="text-amber-400 border-amber-400">3</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Live routes</span>
                <Badge variant="secondary">18</Badge>
              </div>
            </div>
            <Button variant="outline" className="w-full text-sm" onClick={() => navigate('/dispatch')}>
              <Activity className="h-4 w-4 mr-2" />
              Open dispatch board
            </Button>
          </Card>
        </div>
      </div>

      {/* SMS Dialog */}
      <Dialog open={showSmsDialog} onOpenChange={setShowSmsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send SMS</DialogTitle>
            <DialogDescription>Send an SMS message via Twilio or Telnyx</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sms-recipient">Recipient Phone Number</Label>
              <Input
                id="sms-recipient"
                type="tel"
                placeholder="+1234567890"
                value={smsRecipient}
                onChange={(e) => setSmsRecipient(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sms-message">Message</Label>
              <Textarea
                id="sms-message"
                placeholder="Type your message..."
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSendSMS} className="flex-1 gradient-primary">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send SMS
              </Button>
              <Button variant="outline" onClick={() => setShowSmsDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Call Dialog */}
      <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Initiate Call</DialogTitle>
            <DialogDescription>Start a phone call via Twilio</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="call-recipient">Recipient Phone Number</Label>
              <Input
                id="call-recipient"
                type="tel"
                placeholder="+1234567890"
                value={callRecipient}
                onChange={(e) => setCallRecipient(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleInitiateCall} className="flex-1 gradient-primary">
                <Phone className="h-4 w-4 mr-2" />
                Start Call
              </Button>
              <Button variant="outline" onClick={() => setShowCallDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
            <DialogDescription>Compose and send an email</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-recipient">Recipient Email</Label>
              <Input
                id="email-recipient"
                type="email"
                placeholder="recipient@example.com"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                type="text"
                placeholder="Email subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-body">Message</Label>
              <Textarea
                id="email-body"
                placeholder="Type your email message..."
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={6}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSendEmail} className="flex-1 gradient-primary">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
