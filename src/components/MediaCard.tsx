import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Asset, ProcessingJob } from '@/lib/mockData';

interface MediaCardProps {
  asset: Asset;
  jobs?: ProcessingJob[];
  onView?: () => void;
  onEdit?: () => void;
}

export default function MediaCard({ asset, jobs = [], onView, onEdit }: MediaCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-600';
      case 'processing': return 'bg-yellow-600';
      case 'uploading': return 'bg-blue-600';
      case 'failed': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const activeJob = jobs.find(job => job.asset_id === asset.id && job.status === 'processing');

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative">
          <img
            src={asset.thumbnail || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400'}
            alt={asset.title}
            className="w-full h-48 object-cover"
          />
          <Badge 
            className={`absolute top-2 right-2 ${getStatusColor(asset.status)}`}
          >
            {asset.status}
          </Badge>
          {asset.duration && (
            <Badge variant="secondary" className="absolute bottom-2 right-2">
              {Math.floor(asset.duration / 60)}:{(asset.duration % 60).toString().padStart(2, '0')}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <CardTitle className="text-lg mb-2">{asset.title}</CardTitle>
        
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Format:</span>
            <span>{asset.mime}</span>
          </div>
          {asset.width && asset.height && (
            <div className="flex justify-between">
              <span>Resolution:</span>
              <span>{asset.width}×{asset.height}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Created:</span>
            <span>{new Date(asset.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {activeJob && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing: {activeJob.type.replace('_', ' ')}</span>
              <span>{activeJob.progress}%</span>
            </div>
            <Progress value={activeJob.progress} className="h-2" />
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex space-x-2">
        <Button variant="outline" size="sm" onClick={onView} className="flex-1">
          View Details
        </Button>
        <Button variant="default" size="sm" onClick={onEdit} className="flex-1">
          Edit
        </Button>
      </CardFooter>
    </Card>
  );
}