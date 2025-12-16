import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap, Plus, Power, PowerOff, Loader2, Pencil, History, Trash2, X, ChevronDown, ChevronUp, Settings2, Play } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';

interface WorkflowCondition {
  field: string;
  operator: string;
  value: string;
}

interface WorkflowAction {
  type: string;
  config: Record<string, any>;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: string;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  enabled: boolean;
  run_count: number;
  last_run: string | null;
  created_at: string;
  updated_at: string;
}

interface WorkflowLog {
  id: string;
  workflow_id: string;
  status: 'success' | 'failed' | 'skipped';
  trigger_data: Record<string, any>;
  actions_executed: string[];
  error_message: string | null;
  executed_at: string;
}

const TRIGGERS = [
  { id: 'on_message', name: 'On Message', description: 'Triggered when a message is received' },
  { id: 'on_contact_created', name: 'On Contact Created', description: 'Triggered when a new contact is added' },
  { id: 'on_contact_updated', name: 'On Contact Updated', description: 'Triggered when contact info changes' },
  { id: 'before_event', name: 'Before Event', description: 'Triggered before a scheduled event' },
  { id: 'after_event', name: 'After Event', description: 'Triggered after an event completes' },
  { id: 'on_schedule', name: 'On Schedule', description: 'Triggered at a specific time' },
  { id: 'on_tag_added', name: 'On Tag Added', description: 'Triggered when a tag is added to contact' },
  { id: 'on_payment', name: 'On Payment', description: 'Triggered when payment is received' },
];

const ACTIONS = [
  { id: 'send_message', name: 'Send Message', description: 'Send a message to the contact' },
  { id: 'add_tag', name: 'Add Tag', description: 'Add a tag to the contact' },
  { id: 'remove_tag', name: 'Remove Tag', description: 'Remove a tag from the contact' },
  { id: 'create_task', name: 'Create Task', description: 'Create a follow-up task' },
  { id: 'send_notification', name: 'Send Notification', description: 'Send a push notification' },
  { id: 'update_contact', name: 'Update Contact', description: 'Update contact information' },
  { id: 'trigger_webhook', name: 'Trigger Webhook', description: 'Call an external webhook' },
  { id: 'ai_process', name: 'AI Process', description: 'Process with AI for insights' },
];

const OPERATORS = [
  { id: 'equals', name: 'Equals' },
  { id: 'not_equals', name: 'Not Equals' },
  { id: 'contains', name: 'Contains' },
  { id: 'not_contains', name: 'Does Not Contain' },
  { id: 'greater_than', name: 'Greater Than' },
  { id: 'less_than', name: 'Less Than' },
  { id: 'starts_with', name: 'Starts With' },
  { id: 'ends_with', name: 'Ends With' },
];

const CONDITION_FIELDS = [
  { id: 'direction', name: 'Message Direction' },
  { id: 'channel', name: 'Channel' },
  { id: 'body', name: 'Message Body' },
  { id: 'contact_name', name: 'Contact Name' },
  { id: 'ai_result.meeting_detected', name: 'Meeting Detected' },
  { id: 'ai_result.importance', name: 'Importance Score' },
  { id: 'ai_result.intent', name: 'Intent' },
  { id: 'tags', name: 'Contact Tags' },
];

export default function Workflows() {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [editingWorkflow, setEditingWorkflow] = useState<Partial<Workflow>>({
    name: '',
    description: '',
    trigger: 'on_message',
    conditions: [],
    actions: [],
    enabled: true,
  });

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const response = await apiClient.get<Workflow[]>('/api/workflows');
      return response.data;
    },
  });

  const { data: workflowLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['workflow-logs', selectedWorkflow?.id],
    queryFn: async () => {
      if (!selectedWorkflow) return [];
      const response = await apiClient.get<WorkflowLog[]>(`/api/workflows/${selectedWorkflow.id}/logs`);
      return response.data;
    },
    enabled: !!selectedWorkflow && logsDialogOpen,
  });

  const toggleMutation = useMutation({
    mutationFn: async (workflowId: string) => {
      const response = await apiClient.post(`/api/workflows/${workflowId}/toggle`);
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
    mutationFn: async (data: Partial<Workflow>) => {
      const response = await apiClient.post('/api/workflows', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow created');
      setCreateDialogOpen(false);
      resetEditingWorkflow();
    },
    onError: () => {
      toast.error('Failed to create workflow');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Workflow> }) => {
      const response = await apiClient.patch(`/api/workflows/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow updated');
      setEditDialogOpen(false);
      setSelectedWorkflow(null);
    },
    onError: () => {
      toast.error('Failed to update workflow');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (workflowId: string) => {
      await apiClient.delete(`/api/workflows/${workflowId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow deleted');
    },
    onError: () => {
      toast.error('Failed to delete workflow');
    },
  });

  const resetEditingWorkflow = () => {
    setEditingWorkflow({
      name: '',
      description: '',
      trigger: 'on_message',
      conditions: [],
      actions: [],
      enabled: true,
    });
  };

  const handleToggle = (workflowId: string) => {
    toggleMutation.mutate(workflowId);
  };

  const handleCreate = () => {
    if (!editingWorkflow.name?.trim()) {
      toast.error('Please enter a workflow name');
      return;
    }
    createMutation.mutate(editingWorkflow);
  };

  const handleEdit = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setEditingWorkflow({
      name: workflow.name,
      description: workflow.description,
      trigger: workflow.trigger,
      conditions: workflow.conditions || [],
      actions: workflow.actions || [],
      enabled: workflow.enabled,
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedWorkflow) return;
    if (!editingWorkflow.name?.trim()) {
      toast.error('Please enter a workflow name');
      return;
    }
    updateMutation.mutate({ id: selectedWorkflow.id, data: editingWorkflow });
  };

  const handleViewLogs = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setLogsDialogOpen(true);
  };

  const handleDelete = (workflowId: string) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      deleteMutation.mutate(workflowId);
    }
  };

  const addCondition = () => {
    setEditingWorkflow({
      ...editingWorkflow,
      conditions: [...(editingWorkflow.conditions || []), { field: 'direction', operator: 'equals', value: '' }],
    });
  };

  const removeCondition = (index: number) => {
    const newConditions = [...(editingWorkflow.conditions || [])];
    newConditions.splice(index, 1);
    setEditingWorkflow({ ...editingWorkflow, conditions: newConditions });
  };

  const updateCondition = (index: number, field: keyof WorkflowCondition, value: string) => {
    const newConditions = [...(editingWorkflow.conditions || [])];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setEditingWorkflow({ ...editingWorkflow, conditions: newConditions });
  };

  const addAction = () => {
    setEditingWorkflow({
      ...editingWorkflow,
      actions: [...(editingWorkflow.actions || []), { type: 'send_message', config: {} }],
    });
  };

  const removeAction = (index: number) => {
    const newActions = [...(editingWorkflow.actions || [])];
    newActions.splice(index, 1);
    setEditingWorkflow({ ...editingWorkflow, actions: newActions });
  };

  const updateAction = (index: number, type: string) => {
    const newActions = [...(editingWorkflow.actions || [])];
    newActions[index] = { type, config: {} };
    setEditingWorkflow({ ...editingWorkflow, actions: newActions });
  };

  const updateActionConfig = (index: number, key: string, value: string) => {
    const newActions = [...(editingWorkflow.actions || [])];
    newActions[index] = { ...newActions[index], config: { ...newActions[index].config, [key]: value } };
    setEditingWorkflow({ ...editingWorkflow, actions: newActions });
  };

  const WorkflowForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="basic">Basic</TabsTrigger>
        <TabsTrigger value="conditions">Conditions</TabsTrigger>
        <TabsTrigger value="actions">Actions</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="name">Workflow Name *</Label>
          <Input
            id="name"
            placeholder="e.g., Auto-respond to new messages"
            value={editingWorkflow.name || ''}
            onChange={(e) => setEditingWorkflow({ ...editingWorkflow, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="What does this workflow do?"
            value={editingWorkflow.description || ''}
            onChange={(e) => setEditingWorkflow({ ...editingWorkflow, description: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="trigger">Trigger *</Label>
          <Select
            value={editingWorkflow.trigger}
            onValueChange={(value) => setEditingWorkflow({ ...editingWorkflow, trigger: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a trigger" />
            </SelectTrigger>
            <SelectContent>
              {TRIGGERS.map((trigger) => (
                <SelectItem key={trigger.id} value={trigger.id}>
                  <div>
                    <div className="font-medium">{trigger.name}</div>
                    <div className="text-xs text-muted-foreground">{trigger.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label>Enabled</Label>
            <p className="text-sm text-muted-foreground">Workflow will run when enabled</p>
          </div>
          <Switch
            checked={editingWorkflow.enabled}
            onCheckedChange={(checked) => setEditingWorkflow({ ...editingWorkflow, enabled: checked })}
          />
        </div>
      </TabsContent>

      <TabsContent value="conditions" className="space-y-4 mt-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Conditions</Label>
            <p className="text-sm text-muted-foreground">Filter when this workflow runs</p>
          </div>
          <Button variant="outline" size="sm" onClick={addCondition}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        {(editingWorkflow.conditions || []).length === 0 ? (
          <Card className="p-4 text-center text-muted-foreground">
            <p>No conditions - workflow runs on every trigger</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {(editingWorkflow.conditions || []).map((condition, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center gap-2">
                  <Select
                    value={condition.field}
                    onValueChange={(value) => updateCondition(index, 'field', value)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITION_FIELDS.map((field) => (
                        <SelectItem key={field.id} value={field.id}>{field.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={condition.operator}
                    onValueChange={(value) => updateCondition(index, 'operator', value)}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATORS.map((op) => (
                        <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Value"
                    value={condition.value}
                    onChange={(e) => updateCondition(index, 'value', e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeCondition(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="actions" className="space-y-4 mt-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Actions</Label>
            <p className="text-sm text-muted-foreground">What happens when triggered</p>
          </div>
          <Button variant="outline" size="sm" onClick={addAction}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        {(editingWorkflow.actions || []).length === 0 ? (
          <Card className="p-4 text-center text-muted-foreground">
            <p>No actions configured</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {(editingWorkflow.actions || []).map((action, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <Select
                      value={action.type}
                      onValueChange={(value) => updateAction(index, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTIONS.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            <div>
                              <div className="font-medium">{a.name}</div>
                              <div className="text-xs text-muted-foreground">{a.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Action-specific config */}
                    {action.type === 'send_message' && (
                      <div className="space-y-2 pl-2 border-l-2">
                        <Input
                          placeholder="Message template or text"
                          value={action.config?.template || action.config?.message || ''}
                          onChange={(e) => updateActionConfig(index, 'message', e.target.value)}
                        />
                      </div>
                    )}
                    {action.type === 'add_tag' && (
                      <Input
                        placeholder="Tag name"
                        value={action.config?.tag || ''}
                        onChange={(e) => updateActionConfig(index, 'tag', e.target.value)}
                      />
                    )}
                    {action.type === 'remove_tag' && (
                      <Input
                        placeholder="Tag name"
                        value={action.config?.tag || ''}
                        onChange={(e) => updateActionConfig(index, 'tag', e.target.value)}
                      />
                    )}
                    {action.type === 'create_task' && (
                      <Input
                        placeholder="Task title"
                        value={action.config?.title || ''}
                        onChange={(e) => updateActionConfig(index, 'title', e.target.value)}
                      />
                    )}
                    {action.type === 'send_notification' && (
                      <Input
                        placeholder="Notification message"
                        value={action.config?.message || ''}
                        onChange={(e) => updateActionConfig(index, 'message', e.target.value)}
                      />
                    )}
                    {action.type === 'trigger_webhook' && (
                      <Input
                        placeholder="Webhook URL"
                        value={action.config?.url || ''}
                        onChange={(e) => updateActionConfig(index, 'url', e.target.value)}
                      />
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeAction(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );

  return (
    <div className="space-y-6 w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Workflows</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Automate your CRM with powerful workflows
          </p>
        </div>
        <Button className="gradient-primary w-fit" onClick={() => { resetEditingWorkflow(); setCreateDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Workflow
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
          <Button className="gradient-primary" onClick={() => { resetEditingWorkflow(); setCreateDialogOpen(true); }}>
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
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${workflow.enabled ? 'bg-gradient-to-br from-secondary to-accent' : 'bg-muted'}`}>
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base sm:text-lg truncate">{workflow.name}</h3>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {TRIGGERS.find(t => t.id === workflow.trigger)?.name || workflow.trigger}
                      </Badge>
                      <Badge variant={workflow.enabled ? 'default' : 'secondary'} className="text-xs">
                        {workflow.enabled ? 'Active' : 'Disabled'}
                      </Badge>
                      {workflow.run_count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {workflow.run_count} runs
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggle(workflow.id)}
                  className={`flex-shrink-0 ${workflow.enabled ? 'text-green-500 hover:text-green-600' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {workflow.enabled ? <Power className="h-5 w-5" /> : <PowerOff className="h-5 w-5" />}
                </Button>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">{workflow.description}</p>

              {/* Workflow summary */}
              <div className="text-xs text-muted-foreground mb-3 space-y-1">
                <div>Conditions: {workflow.conditions?.length || 0}</div>
                <div>Actions: {workflow.actions?.length || 0}</div>
                {workflow.last_run && (
                  <div>Last run: {new Date(workflow.last_run).toLocaleString()}</div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="text-xs flex-1 min-w-[60px]" onClick={() => handleEdit(workflow)}>
                  <Pencil className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="text-xs flex-1 min-w-[60px]" onClick={() => handleViewLogs(workflow)}>
                  <History className="h-3 w-3 mr-1" /> Logs
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive text-xs"
                  onClick={() => handleDelete(workflow.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Available Triggers & Actions Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-panel p-4">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Play className="h-4 w-4" /> Available Triggers
          </h3>
          <div className="space-y-2">
            {TRIGGERS.map(trigger => (
              <div key={trigger.id} className="text-sm">
                <span className="font-medium">{trigger.name}</span>
                <span className="text-muted-foreground ml-2 text-xs">{trigger.description}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="glass-panel p-4">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Settings2 className="h-4 w-4" /> Available Actions
          </h3>
          <div className="space-y-2">
            {ACTIONS.map(action => (
              <div key={action.id} className="text-sm">
                <span className="font-medium">{action.name}</span>
                <span className="text-muted-foreground ml-2 text-xs">{action.description}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Create Workflow Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Workflow</DialogTitle>
            <DialogDescription>
              Set up automation rules to handle tasks automatically
            </DialogDescription>
          </DialogHeader>
          <WorkflowForm />
          <div className="flex justify-end gap-2 mt-4">
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

      {/* Edit Workflow Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Workflow</DialogTitle>
            <DialogDescription>
              Modify your workflow settings
            </DialogDescription>
          </DialogHeader>
          <WorkflowForm isEdit />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
              className="gradient-primary"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Workflow Logs Dialog */}
      <Dialog open={logsDialogOpen} onOpenChange={setLogsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Workflow Logs</DialogTitle>
            <DialogDescription>
              {selectedWorkflow?.name} - Execution history
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {logsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : workflowLogs.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No execution logs yet</p>
              </Card>
            ) : (
              workflowLogs.map(log => (
                <Card key={log.id} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge variant={log.status === 'success' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}>
                        {log.status}
                      </Badge>
                      <p className="text-sm mt-1">
                        Actions: {log.actions_executed.join(', ') || 'None'}
                      </p>
                      {log.error_message && (
                        <p className="text-sm text-destructive mt-1">{log.error_message}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.executed_at).toLocaleString()}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setLogsDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
