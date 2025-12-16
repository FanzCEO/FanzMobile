import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Radio, Send, Phone, MessageSquare, Mic, MicOff, AlertTriangle, Bot, Plug, MapPin, Activity, Mail } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { threadsApi } from '@/lib/api/threads';
import type { Thread, ThreadEvent } from '@/types/thread';
import { toast } from 'sonner';
import { useRealtime } from '@/lib/realtime';
import { useAuth } from '@/lib/hooks/useAuth';
import { livekitApi } from '@/lib/livekit';
import { useEffect } from 'react';

const MOCK_THREADS: Thread[] = [
  {
    id: 'thread-1',
    title: 'Fleet 12 Dispatch',
    channel: 'PTT',
    last: 'Inbound voice: “Loaded, heading to Bay 4”',
    unread: true,
    events: [
      { id: 'e-1', type: 'voice', direction: 'inbound', body: 'Voice clip: Loaded, heading to Bay 4', channel: 'PTT', at: '10:14', meta: '00:12' },
      { id: 'e-2', type: 'transcript', direction: 'inbound', body: 'Transcript: Loaded, heading to Bay 4. ETA 20 mins.', channel: 'AI', at: '10:14' },
      { id: 'e-3', type: 'message', direction: 'outbound', body: 'Copy. Bay 4 is clear. Watch for detour on I-95.', channel: 'SMS', at: '10:15' },
    ],
  },
  {
    id: 'thread-2',
    title: 'Ravenna (WhatsApp)',
    channel: 'WhatsApp',
    last: 'Inbound: “Can we move delivery up?”',
    events: [
      { id: 'e-4', type: 'message', direction: 'inbound', body: 'Can we move delivery up?', channel: 'WhatsApp', at: '09:52' },
      { id: 'e-5', type: 'message', direction: 'outbound', body: 'Checking with dispatch now.', channel: 'WhatsApp', at: '09:55' },
    ],
  },
  {
    id: 'thread-3',
    title: 'Shop Ops (Telegram)',
    channel: 'Telegram',
    last: 'Outbound: “Upload today’s route CSV”',
    events: [
      { id: 'e-6', type: 'message', direction: 'outbound', body: 'Upload today’s route CSV', channel: 'Telegram', at: '08:30' },
    ],
  },
];

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
  const { user } = useAuth();
  const [selectedThreadId, setSelectedThreadId] = useState<string>('thread-1');
  const [reply, setReply] = useState('');
  const [pttActive, setPttActive] = useState(false);
  const [pttReady, setPttReady] = useState(false);
  const [pttError, setPttError] = useState<string | null>(null);
  const [pttRoom, setPttRoom] = useState<any>(null);
  const [pttTrack, setPttTrack] = useState<any>(null);

  const { data: threads = MOCK_THREADS } = useQuery({
    queryKey: ['threads'],
    queryFn: () => threadsApi.list({ limit: 50 }),
    retry: false,
    staleTime: 15_000,
  });
  const hasThreads = threads.length > 0 && threads !== MOCK_THREADS;

  const selectedThread = useMemo(() => {
    return threads.find((t) => t.id === selectedThreadId) || threads[0] || MOCK_THREADS[0];
  }, [threads, selectedThreadId]);

  const { data: events = selectedThread?.events || [] } = useQuery<ThreadEvent[]>({
    queryKey: ['thread-events', selectedThread?.id],
    queryFn: () => threadsApi.getEvents(selectedThread!.id),
    enabled: !!selectedThread?.id,
    retry: false,
  });

  const livekitConfigured =
    !!import.meta.env.VITE_LIVEKIT_URL && !!import.meta.env.VITE_LIVEKIT_API_KEY && !!import.meta.env.VITE_LIVEKIT_API_SECRET;
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
    if (!livekitConfigured) {
      setPttError('LiveKit not configured');
      return;
    }
    try {
      const roomName = roomId;
      const identity = userId || 'anonymous';
      const token = await livekitApi.getToken(roomName, identity);
      // Lazy load livekit-client from CDN to avoid bundling/install failure
      const lk = await import(/* @vite-ignore */ 'https://esm.sh/livekit-client@2.8.2');
      const room = await lk.connect(import.meta.env.VITE_LIVEKIT_URL as string, token, {
        autoSubscribe: true,
      });
      const micTrack = await lk.createLocalAudioTrack();
      await room.localParticipant.publishTrack(micTrack);
      await micTrack.mute?.();
      setPttTrack(micTrack);
      setPttRoom(room);
      setPttReady(true);
      toast.success('PTT connected');
    } catch (error) {
      console.error('PTT join failed', error);
      setPttError('PTT join failed');
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
            <div className="flex items-center gap-2">
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
                    Set VITE_LIVEKIT_URL/API_KEY/API_SECRET to enable PTT
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
            <Button variant="outline" className="w-full text-sm">Manage integrations</Button>
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
            <Button variant="outline" className="w-full text-sm">
              <Activity className="h-4 w-4 mr-2" />
              Open dispatch board
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
