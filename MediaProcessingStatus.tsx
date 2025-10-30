import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MediaProcessingJob, mediaProcessor } from '@/lib/mediaProcessing';

interface MediaProcessingStatusProps {
  jobId?: string;
  onComplete?: () => void;
}

export default function MediaProcessingStatus({ jobId, onComplete }: MediaProcessingStatusProps) {
  const [job, setJob] = useState<MediaProcessingJob | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(() => {
      const currentJob = mediaProcessor.getJob(jobId);
      if (currentJob) {
        setJob(currentJob);
        if (currentJob.status === 'completed' && onComplete) {
          onComplete();
          clearInterval(interval);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [jobId, onComplete]);

  if (!job) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-600';
      case 'processing': return 'bg-blue-600';
      case 'failed': return 'bg-red-600';
      default: return 'bg-gray-400';
    }
  };

  const getStepIcon = (stepName: string) => {
    switch (stepName) {
      case 'File Analysis': return '🔍';
      case 'Forensic Signature Generation': return '🔐';
      case 'Transcoding & Encoding': return '⚙️';
      case 'Format Conversion': return '🔄';
      case 'Resolution Optimization': return '📐';
      case 'Quality Enhancement': return '✨';
      case 'DMCA Registration': return '🛡️';
      case 'Upload & Distribution': return '☁️';
      default: return '⏳';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center space-x-2">
            <span>🎬</span>
            <span>Media Processing</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(job.status)}>
              {job.status}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? '▼' : '▶'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{Math.round(job.progress)}%</span>
          </div>
          <Progress value={job.progress} className="h-3" />
        </div>

        {/* Forensic Signature Info */}
        {job.forensicSignature && (
          <Alert>
            <AlertDescription className="text-xs">
              <div className="flex items-center space-x-2">
                <span>🔐</span>
                <div>
                  <p className="font-medium">Forensic Signature Applied</p>
                  <p>ID: {job.forensicSignature.substr(0, 16)}...</p>
                  {job.dmcaProtection && <p>✅ DMCA Protected</p>}
                  {job.copyrightRegistration && <p>✅ Copyright Registered</p>}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Detailed Steps */}
        {isExpanded && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Processing Steps</h4>
            {job.steps.map((step, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getStepIcon(step.name)}</span>
                    <span className="text-sm font-medium">{step.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getStatusColor(step.status)}`}
                    >
                      {step.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {step.progress}%
                    </span>
                  </div>
                </div>
                
                {step.status !== 'pending' && (
                  <Progress value={step.progress} className="h-1" />
                )}
                
                {step.details && (
                  <p className="text-xs text-muted-foreground ml-6">
                    {step.details}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Processing Features */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center space-x-1">
            <span>🎯</span>
            <span>AI Enhancement</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>🔄</span>
            <span>Multi-Format</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>📐</span>
            <span>Auto-Resize</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>⚡</span>
            <span>Optimized</span>
          </div>
        </div>

        {/* MojoSign-style Protection Info */}
        <Card className="bg-muted/50">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium">🛡️ Content Protection</span>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>✅ Forensic watermarking applied</p>
              <p>✅ DMCA takedown protection enabled</p>
              <p>✅ Content tracking & tracing active</p>
              <p>✅ Automated copyright registration</p>
              <p className="text-blue-600">Powered by FANZ Signature™</p>
            </div>
          </CardContent>
        </Card>

        {job.status === 'completed' && (
          <Alert>
            <AlertDescription className="text-center">
              🎉 Media processing complete! Your content is protected and ready for distribution.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}