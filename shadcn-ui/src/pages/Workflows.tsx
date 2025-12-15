import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap, Plus, Power, PowerOff, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';

interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: string;
  enabled: boolean;
  run_count: number;
  last_run: string | null;
}

const TRIGGERS = [
  { id: 'on_message', name: 'On Message' },
  { id: 'on_contact_created', name: 'On Contact Created' },
  { id: 'on_contact_updated', name: 'On Contact Updated' },
  { id: 'before_event', name: 'Before Event' },
  { id: 'after_event', name: 'After Event' },
  { id: 'on_schedule', name: 'On Schedule' },
  { id: 'on_tag_added', name: 'On Tag Added' },
  { id: 'on_payment', name: 'On Payment' },
];

export default function Workflows() {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    trigger: 'on_message',
  });

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const response = await apiClient.get<Workflow[]>('/workflows');
      return response.data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (workflowId: string) => {
      const response = await apiClient.post(`/workflows/${workflowId}/toggle`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow updated');
    },
    onError: () => {
      toast.error('Failed to update workflow');
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newWorkflow) => {
      const response = await apiClient.post('/workflows', {
        ...data,
        conditions: [],
        actions: [],
        enabled: true,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow created');
      setCreateDialogOpen(false);
      setNewWorkflow({ name: '', description: '', trigger: 'on_message' });
    },
    onError: () => {
      toast.error('Failed to create workflow');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (workflowId: string) => {
      await apiClient.delete(`/workflows/${workflowId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow deleted');
    },
    onError: () => {
      toast.error('Failed to delete workflow');
    },
  });

  const handleToggle = (workflowId: string) => {
    toggleMutation.mutate(workflowId);
  };

  const handleCreate = () => {
    if (!newWorkflow.name.trim()) {
      toast.error('Please enter a workflow name');
      return;
    }
    createMutation.mutate(newWorkflow);
  };

  const handleDelete = (workflowId: string) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      deleteMutation.mutate(workflowId);
    }
  };

  return (
    <div className="space-y-6 w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Workflows</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Automate your CRM with workflows
          </p>
        </div>
        <Button className="gradient-primary w-fit" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create
        </Button>
      </div>

      {/* Workflows Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : workflows.length === 0 ? (
        <Card className="glass-panel p-12 text-center">
          <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
          <p className="text-muted-foreground mb-4">Create your first workflow to automate tasks</p>
          <Button className="gradient-primary" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Workflow
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="glass-panel p-4 sm:p-6">
              <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-secondary to-accent flex items-center justify-center flex-shrink-0">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base sm:text-lg truncate">{workflow.name}</h3>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {workflow.trigger}
                      </Badge>
                      {workflow.run_count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {workflow.run_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggle(workflow.id)}
                  className={`flex-shrink-0 ${workflow.enabled ? 'text-green-500' : 'text-muted-foreground'}`}
                >
                  {workflow.enabled ? <Power className="h-5 w-5" /> : <PowerOff className="h-5 w-5" />}
                </Button>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">{workflow.description}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="text-xs flex-1 min-w-[60px]">
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="text-xs flex-1 min-w-[60px]">
                  Logs
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive text-xs"
                  onClick={() => handleDelete(workflow.id)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card className="glass-panel p-4 sm:p-6 border-primary/50">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
            <Zap className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-base sm:text-lg mb-2">Workflow Automation</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
              Automate tasks based on triggers like messages, contacts, or events.
            </p>
            <Button variant="outline" size="sm" className="text-xs">
              Learn More
            </Button>
          </div>
        </div>
      </Card>

      {/* Create Workflow Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Workflow</DialogTitle>
            <DialogDescription>
              Set up automation rules to handle tasks automatically
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workflow Name</Label>
              <Input
                id="name"
                placeholder="e.g., Auto-respond to new messages"
                value={newWorkflow.name}
                onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What does this workflow do?"
                value={newWorkflow.description}
                onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trigger">Trigger</Label>
              <Select
                value={newWorkflow.trigger}
                onValueChange={(value) => setNewWorkflow({ ...newWorkflow, trigger: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a trigger" />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGERS.map((trigger) => (
                    <SelectItem key={trigger.id} value={trigger.id}>
                      {trigger.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="gradient-primary"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Workflow'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
