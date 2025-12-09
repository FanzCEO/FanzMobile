import { Zap, Plus, Power, PowerOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Workflows() {
  // Mock data for demonstration
  const workflows = [
    {
      id: '1',
      name: 'Auto-confirm meetings',
      trigger: 'on_message',
      enabled: true,
      description: 'Automatically send confirmation when meeting is detected',
    },
    {
      id: '2',
      name: 'Tag VIP contacts',
      trigger: 'on_contact_created',
      enabled: true,
      description: 'Add VIP tag to contacts with high importance score',
    },
    {
      id: '3',
      name: 'Send follow-up reminders',
      trigger: 'before_event',
      enabled: false,
      description: 'Send reminder 1 hour before scheduled events',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Workflows & Automation</h1>
          <p className="text-muted-foreground mt-1">
            Automate your CRM with intelligent workflows
          </p>
        </div>
        <Button className="gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      {/* Workflows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="glass-panel p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{workflow.name}</h3>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {workflow.trigger}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className={workflow.enabled ? 'text-green-500' : 'text-muted-foreground'}
              >
                {workflow.enabled ? <Power className="h-5 w-5" /> : <PowerOff className="h-5 w-5" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{workflow.description}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                Edit
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                View Logs
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      <Card className="glass-panel p-6 border-primary/50">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">Workflow Automation</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Workflows allow you to automate repetitive tasks based on triggers like incoming messages,
              new contacts, or scheduled events. Create custom rules to save time and ensure consistency.
            </p>
            <Button variant="outline" size="sm">
              Learn More
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}