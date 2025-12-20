import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MapPin, Truck, User, Clock, AlertTriangle, CheckCircle,
  RefreshCw, Plus, Phone, MessageSquare, Navigation, Activity,
  XCircle, Play, Pause, Filter, Search
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { cn } from '@/lib/utils';

interface DispatchResource {
  id: string;
  name: string;
  type: 'driver' | 'vehicle' | 'team';
  status: 'available' | 'busy' | 'offline' | 'break';
  current_assignment?: string;
  location?: string;
  phone?: string;
  last_checkin?: string;
}

interface DispatchJob {
  id: string;
  title: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assigned_to?: string;
  location: string;
  eta?: string;
  notes?: string;
  created_at: string;
}

interface DispatchAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  resource_id?: string;
  job_id?: string;
  created_at: string;
  acknowledged: boolean;
}

// API functions
const dispatchApi = {
  getResources: async (): Promise<DispatchResource[]> => {
    try {
      const { data } = await apiClient.get<DispatchResource[]>('/api/dispatch/resources');
      return data;
    } catch {
      // Return mock data if endpoint doesn't exist yet
      return [
        { id: '1', name: 'Driver A', type: 'driver', status: 'available', phone: '+1234567890', location: 'Downtown', last_checkin: '5 min ago' },
        { id: '2', name: 'Driver B', type: 'driver', status: 'busy', current_assignment: 'Delivery #1045', location: 'Highway 101', last_checkin: '2 min ago' },
        { id: '3', name: 'Driver C', type: 'driver', status: 'break', location: 'Rest Stop', last_checkin: '15 min ago' },
        { id: '4', name: 'Team Alpha', type: 'team', status: 'available', location: 'Warehouse', last_checkin: '1 min ago' },
        { id: '5', name: 'Driver D', type: 'driver', status: 'offline', location: 'Unknown', last_checkin: '2 hours ago' },
      ];
    }
  },

  getJobs: async (): Promise<DispatchJob[]> => {
    try {
      const { data } = await apiClient.get<DispatchJob[]>('/api/dispatch/jobs');
      return data;
    } catch {
      return [
        { id: 'j1', title: 'Pickup at 123 Main St', status: 'pending', priority: 'high', location: '123 Main St', created_at: '10:30 AM' },
        { id: 'j2', title: 'Delivery to Bay 4', status: 'in_progress', priority: 'normal', assigned_to: '2', location: 'Bay 4', eta: '15 min', created_at: '09:45 AM' },
        { id: 'j3', title: 'Service call - HVAC', status: 'assigned', priority: 'normal', assigned_to: '4', location: '456 Oak Ave', created_at: '08:00 AM' },
        { id: 'j4', title: 'Emergency repair', status: 'pending', priority: 'urgent', location: '789 Pine Rd', created_at: '11:00 AM' },
        { id: 'j5', title: 'Routine inspection', status: 'completed', priority: 'low', assigned_to: '1', location: 'Site C', created_at: 'Yesterday' },
      ];
    }
  },

  getAlerts: async (): Promise<DispatchAlert[]> => {
    try {
      const { data } = await apiClient.get<DispatchAlert[]>('/api/dispatch/alerts');
      return data;
    } catch {
      return [
        { id: 'a1', type: 'warning', message: 'Driver B running behind schedule', resource_id: '2', created_at: '5 min ago', acknowledged: false },
        { id: 'a2', type: 'error', message: 'Vehicle 3 needs maintenance', resource_id: '3', created_at: '30 min ago', acknowledged: false },
        { id: 'a3', type: 'info', message: 'New high-priority job added', job_id: 'j4', created_at: '10 min ago', acknowledged: true },
      ];
    }
  },

  assignJob: async (jobId: string, resourceId: string): Promise<void> => {
    await apiClient.post(`/api/dispatch/jobs/${jobId}/assign`, { resource_id: resourceId });
  },

  updateJobStatus: async (jobId: string, status: string): Promise<void> => {
    await apiClient.patch(`/api/dispatch/jobs/${jobId}`, { status });
  },

  acknowledgeAlert: async (alertId: string): Promise<void> => {
    await apiClient.post(`/api/dispatch/alerts/${alertId}/acknowledge`);
  },
};

export default function Dispatch() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedJob, setSelectedJob] = useState<DispatchJob | null>(null);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);

  const { data: resources = [], isLoading: loadingResources, refetch: refetchResources } = useQuery({
    queryKey: ['dispatch-resources'],
    queryFn: dispatchApi.getResources,
    refetchInterval: 30000,
  });

  const { data: jobs = [], isLoading: loadingJobs, refetch: refetchJobs } = useQuery({
    queryKey: ['dispatch-jobs'],
    queryFn: dispatchApi.getJobs,
    refetchInterval: 30000,
  });

  const { data: alerts = [], refetch: refetchAlerts } = useQuery({
    queryKey: ['dispatch-alerts'],
    queryFn: dispatchApi.getAlerts,
    refetchInterval: 15000,
  });

  const assignMutation = useMutation({
    mutationFn: ({ jobId, resourceId }: { jobId: string; resourceId: string }) =>
      dispatchApi.assignJob(jobId, resourceId),
    onSuccess: () => {
      toast.success('Job assigned');
      refetchJobs();
      refetchResources();
      setSelectedJob(null);
      setSelectedResource(null);
    },
    onError: () => {
      toast.error('Failed to assign job');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ jobId, status }: { jobId: string; status: string }) =>
      dispatchApi.updateJobStatus(jobId, status),
    onSuccess: () => {
      toast.success('Status updated');
      refetchJobs();
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (alertId: string) => dispatchApi.acknowledgeAlert(alertId),
    onSuccess: () => {
      refetchAlerts();
    },
  });

  const handleRefresh = () => {
    refetchResources();
    refetchJobs();
    refetchAlerts();
    toast.success('Dispatch data refreshed');
  };

  const filteredResources = resources.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (searchTerm && !r.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const filteredJobs = jobs.filter((j) => {
    if (statusFilter !== 'all' && j.status !== statusFilter) return false;
    if (searchTerm && !j.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged);
  const availableResources = resources.filter((r) => r.status === 'available');
  const activeJobs = jobs.filter((j) => ['pending', 'assigned', 'in_progress'].includes(j.status));

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-green-500/20 text-green-400',
      busy: 'bg-blue-500/20 text-blue-400',
      offline: 'bg-gray-500/20 text-gray-400',
      break: 'bg-amber-500/20 text-amber-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      assigned: 'bg-blue-500/20 text-blue-400',
      in_progress: 'bg-purple-500/20 text-purple-400',
      completed: 'bg-green-500/20 text-green-400',
      cancelled: 'bg-red-500/20 text-red-400',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'text-gray-400',
      normal: 'text-blue-400',
      high: 'text-amber-400',
      urgent: 'text-red-400',
    };
    return colors[priority] || 'text-gray-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gradient">Dispatch Board</h1>
            <p className="text-muted-foreground">
              Manage resources, assignments, and live operations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button className="gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Job
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="glass-panel p-3 text-center">
          <p className="text-2xl font-bold text-green-400">{availableResources.length}</p>
          <p className="text-xs text-muted-foreground">Available</p>
        </Card>
        <Card className="glass-panel p-3 text-center">
          <p className="text-2xl font-bold text-blue-400">{activeJobs.length}</p>
          <p className="text-xs text-muted-foreground">Active Jobs</p>
        </Card>
        <Card className="glass-panel p-3 text-center">
          <p className="text-2xl font-bold text-amber-400">{unacknowledgedAlerts.length}</p>
          <p className="text-xs text-muted-foreground">Alerts</p>
        </Card>
        <Card className="glass-panel p-3 text-center">
          <p className="text-2xl font-bold text-purple-400">{resources.length}</p>
          <p className="text-xs text-muted-foreground">Total Resources</p>
        </Card>
      </div>

      {/* Alerts Banner */}
      {unacknowledgedAlerts.length > 0 && (
        <Card className="glass-panel p-4 border-amber-500/50">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <h3 className="font-semibold">Active Alerts</h3>
          </div>
          <div className="space-y-2">
            {unacknowledgedAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <div className="flex items-center gap-2">
                  {alert.type === 'error' && <XCircle className="h-4 w-4 text-red-400" />}
                  {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-400" />}
                  {alert.type === 'info' && <Activity className="h-4 w-4 text-blue-400" />}
                  <span className="text-sm">{alert.message}</span>
                  <span className="text-xs text-muted-foreground">{alert.created_at}</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => acknowledgeMutation.mutate(alert.id)}>
                  Acknowledge
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Search and Filter */}
      <Card className="glass-panel p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources or jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'available' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('available')}
            >
              Available
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('pending')}
            >
              Pending
            </Button>
            <Button
              variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('in_progress')}
            >
              In Progress
            </Button>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="resources" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="resources">
            <User className="h-4 w-4 mr-2" />
            Resources ({resources.length})
          </TabsTrigger>
          <TabsTrigger value="jobs">
            <Truck className="h-4 w-4 mr-2" />
            Jobs ({jobs.length})
          </TabsTrigger>
        </TabsList>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4">
          {loadingResources ? (
            <Card className="glass-panel p-8 text-center text-muted-foreground">
              Loading resources...
            </Card>
          ) : filteredResources.length === 0 ? (
            <Card className="glass-panel p-8 text-center text-muted-foreground">
              No resources found
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.map((resource) => (
                <Card
                  key={resource.id}
                  className={cn(
                    'glass-panel p-4 cursor-pointer transition-all',
                    selectedResource === resource.id && 'border-primary'
                  )}
                  onClick={() => setSelectedResource(selectedResource === resource.id ? null : resource.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {resource.type === 'driver' ? (
                        <User className="h-5 w-5 text-primary" />
                      ) : resource.type === 'vehicle' ? (
                        <Truck className="h-5 w-5 text-primary" />
                      ) : (
                        <Activity className="h-5 w-5 text-primary" />
                      )}
                      <div>
                        <p className="font-semibold">{resource.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{resource.type}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(resource.status)}>
                      {resource.status}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span>{resource.location || 'Unknown'}</span>
                    </div>
                    {resource.current_assignment && (
                      <div className="flex items-center gap-2">
                        <Truck className="h-3 w-3" />
                        <span>{resource.current_assignment}</span>
                      </div>
                    )}
                    {resource.last_checkin && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>Last seen: {resource.last_checkin}</span>
                      </div>
                    )}
                  </div>
                  {selectedResource === resource.id && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
                      {resource.phone && (
                        <Button size="sm" variant="outline">
                          <Phone className="h-3 w-3 mr-1" />
                          Call
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Message
                      </Button>
                      <Button size="sm" variant="outline">
                        <Navigation className="h-3 w-3 mr-1" />
                        Track
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-4">
          {loadingJobs ? (
            <Card className="glass-panel p-8 text-center text-muted-foreground">
              Loading jobs...
            </Card>
          ) : filteredJobs.length === 0 ? (
            <Card className="glass-panel p-8 text-center text-muted-foreground">
              No jobs found
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map((job) => {
                const assignedResource = resources.find((r) => r.id === job.assigned_to);
                return (
                  <Card
                    key={job.id}
                    className={cn(
                      'glass-panel p-4 cursor-pointer transition-all',
                      selectedJob?.id === job.id && 'border-primary'
                    )}
                    onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{job.title}</h4>
                          <Badge className={getPriorityColor(job.priority)} variant="outline">
                            {job.priority}
                          </Badge>
                          <Badge className={getStatusColor(job.status)}>
                            {job.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{job.location}</span>
                          </div>
                          {job.eta && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>ETA: {job.eta}</span>
                            </div>
                          )}
                          {assignedResource && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{assignedResource.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{job.created_at}</span>
                    </div>

                    {selectedJob?.id === job.id && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="flex flex-wrap gap-2">
                          {job.status === 'pending' && (
                            <>
                              <div className="flex items-center gap-2">
                                <Label className="text-sm">Assign to:</Label>
                                <select
                                  className="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm"
                                  value={selectedResource || ''}
                                  onChange={(e) => setSelectedResource(e.target.value)}
                                >
                                  <option value="">Select resource</option>
                                  {availableResources.map((r) => (
                                    <option key={r.id} value={r.id}>
                                      {r.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <Button
                                size="sm"
                                disabled={!selectedResource}
                                onClick={() => {
                                  if (selectedResource) {
                                    assignMutation.mutate({ jobId: job.id, resourceId: selectedResource });
                                  }
                                }}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Assign
                              </Button>
                            </>
                          )}
                          {job.status === 'assigned' && (
                            <Button
                              size="sm"
                              onClick={() => updateStatusMutation.mutate({ jobId: job.id, status: 'in_progress' })}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Start
                            </Button>
                          )}
                          {job.status === 'in_progress' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateStatusMutation.mutate({ jobId: job.id, status: 'completed' })}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Complete
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatusMutation.mutate({ jobId: job.id, status: 'assigned' })}
                              >
                                <Pause className="h-3 w-3 mr-1" />
                                Pause
                              </Button>
                            </>
                          )}
                          {['pending', 'assigned'].includes(job.status) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-400"
                              onClick={() => updateStatusMutation.mutate({ jobId: job.id, status: 'cancelled' })}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
