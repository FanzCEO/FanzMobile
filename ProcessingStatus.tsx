import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ProcessingJob } from '@/lib/mockData';

interface ProcessingStatusProps {
  jobs: ProcessingJob[];
}

export default function ProcessingStatus({ jobs }: ProcessingStatusProps) {
  const getJobIcon = (type: string) => {
    switch (type) {
      case 'ingest': return '📥';
      case 'transcode': return '🔄';
      case 'generate_derivatives': return '🎬';
      case 'ai_enhance': return '🤖';
      case 'schedule_publish': return '📅';
      case 'notify': return '🔔';
      default: return '⚙️';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-600';
      case 'processing': return 'bg-blue-600';
      case 'failed': return 'bg-red-600';
      case 'pending': return 'bg-yellow-600';
      default: return 'bg-gray-600';
    }
  };

  if (jobs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🤖</span>
            <span>AI Processing Pipeline</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No active processing jobs</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>🤖</span>
          <span>AI Processing Pipeline</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {jobs.map((job) => (
          <div key={job.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span>{getJobIcon(job.type)}</span>
                <span className="font-medium">
                  {job.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
              <Badge className={getStatusColor(job.status)}>
                {job.status}
              </Badge>
            </div>
            
            {job.status === 'processing' && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Progress</span>
                  <span>{job.progress}%</span>
                </div>
                <Progress value={job.progress} className="h-2" />
              </div>
            )}
            
            <div className="text-xs text-muted-foreground">
              Started: {new Date(job.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}