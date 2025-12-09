import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar as CalendarIcon, MapPin } from 'lucide-react';
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
      ) : events.length === 0 ? (
        <Card className="glass-panel p-12">
          <div className="text-center">
            <img
              src="/images/NoEvents.jpg"
              alt="No events"
              className="w-48 h-48 mx-auto mb-6 opacity-50"
            />
            <h3 className="text-xl font-bold mb-2">No events scheduled</h3>
            <p className="text-muted-foreground mb-6">
              Create your first event or let AI detect meetings from messages
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Event
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-8">
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
                      <Badge
                        variant="outline"
                        className={
                          event.status === 'confirmed'
                            ? 'bg-green-500/20 text-green-500'
                            : event.status === 'tentative'
                            ? 'bg-yellow-500/20 text-yellow-500'
                            : 'bg-red-500/20 text-red-500'
                        }
                      >
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