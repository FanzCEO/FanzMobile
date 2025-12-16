import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar as CalendarIcon, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { eventsApi } from '@/lib/api/events';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime, formatDate } from '@/lib/utils/date';
import { toast } from 'sonner';

export default function Calendar() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
  });
  const [viewMonth, setViewMonth] = useState(() => new Date());

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsApi.getEvents({ limit: 100 }),
  });

  const createEventMutation = useMutation({
    mutationFn: eventsApi.createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setIsDialogOpen(false);
      setNewEvent({ title: '', description: '', start_time: '', end_time: '', location: '' });
      toast.success('Event created successfully');
    },
    onError: () => {
      toast.error('Failed to create event');
    },
  });

  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.start_time) {
      toast.error('Please provide title and start time');
      return;
    }
    createEventMutation.mutate(newEvent);
  };

  const upcomingEvents = events.filter((e) => new Date(e.start_time) > new Date());
  const pastEvents = events.filter((e) => new Date(e.start_time) <= new Date());

  const formatDateKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const eventsByDay = useMemo(() => {
    const map: Record<string, typeof events> = {};
    events.forEach((event) => {
      const key = formatDateKey(new Date(event.start_time));
      if (!map[key]) map[key] = [];
      map[key].push(event);
    });
    return map;
  }, [events]);

  const startOfMonth = useMemo(() => new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1), [viewMonth]);
  const gridStart = useMemo(() => {
    const startDay = startOfMonth.getDay(); // 0-6 Sunday start
    const start = new Date(startOfMonth);
    start.setDate(start.getDate() - startDay);
    return start;
  }, [startOfMonth]);

  const monthDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + i);
      const key = formatDateKey(date);
      days.push({
        date,
        key,
        isCurrentMonth: date.getMonth() === viewMonth.getMonth(),
        isToday: key === formatDateKey(new Date()),
        events: eventsByDay[key] || [],
      });
    }
    return days;
  }, [gridStart, viewMonth, eventsByDay]);

  const handlePrevMonth = () => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const formatTimeShort = (iso: string) =>
    new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(iso));

  const statusBadgeClass = (status: string) => {
    const map: Record<string, string> = {
      confirmed: 'bg-green-500/20 text-green-500',
      tentative: 'bg-yellow-500/20 text-yellow-500',
      cancelled: 'bg-red-500/20 text-red-500',
      scheduled: 'bg-blue-500/20 text-blue-500',
      completed: 'bg-emerald-500/20 text-emerald-500',
    };
    return map[status] || 'bg-muted text-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Calendar</h1>
          <p className="text-muted-foreground mt-1">
            Manage your meetings and events with calendar sync
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Meeting with client"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Event details..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  value={newEvent.start_time}
                  onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={newEvent.end_time}
                  onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder="123 Main St, City"
                />
              </div>
              <Button
                onClick={handleCreateEvent}
                disabled={createEventMutation.isPending}
                className="w-full gradient-primary"
              >
                {createEventMutation.isPending ? 'Creating...' : 'Create Event'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading events...</div>
      ) : (
        <div className="space-y-8">
          {/* Month View */}
          <Card className="glass-panel p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-lg font-semibold">
                  {viewMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
                </div>
                <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex h-2 w-2 rounded-full bg-primary" /> Event day
                <span className="inline-flex h-2 w-2 rounded-full bg-secondary" /> Today
              </div>
            </div>
            <div className="grid grid-cols-7 text-xs text-muted-foreground mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center font-medium">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {monthDays.map((day) => (
                <div
                  key={day.key}
                  className={`border rounded-lg p-2 min-h-[110px] flex flex-col gap-2 ${
                    day.isCurrentMonth ? 'bg-background/60' : 'bg-muted/40 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className={day.isToday ? 'font-bold text-primary' : ''}>{day.date.getDate()}</span>
                    {day.events.length > 0 && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <div className="space-y-1">
                    {day.events.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="text-xs p-2 rounded-md bg-primary/10 text-foreground border border-primary/20"
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        <div className="text-muted-foreground text-[11px]">
                          {formatTimeShort(event.start_time)}
                          {event.location ? ` • ${event.location}` : ''}
                        </div>
                      </div>
                    ))}
                    {day.events.length > 3 && (
                      <div className="text-[11px] text-muted-foreground">+{day.events.length - 3} more</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Empty state when no events */}
          {events.length === 0 && (
            <Card className="glass-panel p-8 text-center">
              <img
                src="/images/NoEvents.jpg"
                alt="No events"
                className="w-36 h-36 mx-auto mb-4 opacity-50"
              />
              <h3 className="text-xl font-bold mb-2">No events scheduled</h3>
              <p className="text-muted-foreground mb-6">
                Create your first event or let AI detect meetings from messages
              </p>
              <Button onClick={() => setIsDialogOpen(true)} className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Event
              </Button>
            </Card>
          )}

          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <CalendarIcon className="h-6 w-6 text-accent" />
                Upcoming Events
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingEvents.map((event) => (
                  <Card key={event.id} className="glass-panel p-6 hover:scale-105 transition-transform">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-lg">{event.title}</h3>
                      <Badge variant="outline" className={statusBadgeClass(event.status)}>
                        {event.status}
                      </Badge>
                    </div>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                    )}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarIcon className="h-4 w-4 text-primary" />
                        <span>{formatDateTime(event.start_time)}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-muted-foreground">Past Events</h2>
              <div className="space-y-3">
                {pastEvents.map((event) => (
                  <Card key={event.id} className="glass-panel p-4 opacity-60">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{event.title}</h3>
                        <p className="text-sm text-muted-foreground">{formatDate(event.start_time)}</p>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
