import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Users, Calendar as CalendarIcon, Zap } from 'lucide-react';
import { AIOrb } from '@/components/dashboard/AIOrb';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { messagesApi } from '@/lib/api/messages';
import { contactsApi } from '@/lib/api/contacts';
import { eventsApi } from '@/lib/api/events';
import { Card } from '@/components/ui/card';
import { formatRelativeTime } from '@/lib/utils/date';

export default function Dashboard() {
  const { data: messages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => messagesApi.getMessages({ limit: 5 }),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactsApi.getContacts({ limit: 100 }),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsApi.getEvents({ limit: 100 }),
  });

  const upcomingEvents = events.filter(
    (event) => new Date(event.start_time) > new Date()
  ).slice(0, 5);

  return (
    <div className="space-y-6 sm:space-y-8 w-full overflow-x-hidden">
      {/* Header */}
      <div className="text-center px-2">
        <h1 className="text-2xl sm:text-4xl font-bold mb-2">
          Welcome to <span className="text-gradient">Wicked</span>
        </h1>
        <p className="text-muted-foreground text-sm sm:text-lg">
          The AI-Powered CRM for Creators & Entertainers
        </p>
      </div>

      {/* AI Orb */}
      <div className="flex justify-center py-4 sm:py-8">
        <AIOrb state="idle" size="lg" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatsCard
          title="Total Messages"
          value={messages.length}
          icon={MessageSquare}
          color="blue"
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Contacts"
          value={contacts.length}
          icon={Users}
          color="violet"
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Upcoming Events"
          value={upcomingEvents.length}
          icon={CalendarIcon}
          color="cyan"
        />
        <StatsCard
          title="AI Processed"
          value={messages.filter((m) => m.ai_processed).length}
          icon={Zap}
          color="pink"
          trend={{ value: 15, isPositive: true }}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Messages */}
        <Card className="glass-panel p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Recent Messages
          </h2>
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <img
                  src="/images/NoMessages.jpg"
                  alt="No messages"
                  className="w-32 h-32 mx-auto mb-4 opacity-50"
                />
                <p className="text-muted-foreground">No messages yet</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-sm font-medium">{message.channel.toUpperCase()}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(message.received_at)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{message.body}</p>
                  {message.ai_processed && (
                    <div className="mt-2 flex gap-2">
                      <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary">
                        AI Processed
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Upcoming Events */}
        <Card className="glass-panel p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-accent" />
            Upcoming Events
          </h2>
          <div className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8">
                <img
                  src="/images/Events.jpg"
                  alt="No events"
                  className="w-32 h-32 mx-auto mb-4 opacity-50"
                />
                <p className="text-muted-foreground">No upcoming events</p>
              </div>
            ) : (
              upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-sm font-medium">{event.title}</span>
                    <span className="text-xs px-2 py-1 rounded bg-accent/20 text-accent">
                      {event.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(event.start_time)}
                  </p>
                  {event.location && (
                    <p className="text-xs text-muted-foreground mt-1">📍 {event.location}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}