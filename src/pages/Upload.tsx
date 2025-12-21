import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ComplianceForm from '@/components/ComplianceForm';

interface ComplianceData {
  has_costar: boolean;
  name?: string;
  email?: string;
  phone?: string;
  handle?: string;
}

type SourceType = 'direct' | 'google_drive' | 'icloud' | 'dropbox' | 's3' | 'minio';

interface UploadProps {
  onPageChange: (page: string) => void;
}

export default function Upload({ onPageChange }: UploadProps) {
  const [uploadStep, setUploadStep] = useState<'select' | 'metadata' | 'compliance' | 'processing'>('select');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [metadata, setMetadata] = useState({
    title: '',
    description: '',
    source: 'direct' as SourceType
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    if (files.length > 0) {
      setUploadStep('metadata');
    }
  };

  const handleMetadataSubmit = () => {
    setUploadStep('compliance');
  };

  const handleComplianceSubmit = (complianceData: ComplianceData) => {
    setUploadStep('processing');
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          onPageChange('dashboard');
        }, 1000);
      }
      setUploadProgress(progress);
    }, 500);
  };

  const sourceOptions = [
    { value: 'direct', label: 'Direct Upload', icon: '📤' },
    { value: 'google_drive', label: 'Google Drive', icon: '📁' },
    { value: 'icloud', label: 'iCloud Photos', icon: '☁️' },
    { value: 'dropbox', label: 'Dropbox', icon: '📦' },
    { value: 's3', label: 'Amazon S3', icon: '🪣' },
    { value: 'minio', label: 'MinIO Storage', icon: '🗄️' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => onPageChange('dashboard')}>
          ← Back to Dashboard
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Upload Content</h1>
          <p className="text-muted-foreground">Add new media to your FANZ platform</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center space-x-4 mb-8">
        {[
          { step: 'select', label: 'Select Files', icon: '📁' },
          { step: 'metadata', label: 'Add Metadata', icon: '📝' },
          { step: 'compliance', label: 'Compliance', icon: '🛡️' },
          { step: 'processing', label: 'Processing', icon: '⚙️' }
        ].map((item, index) => (
          <div key={item.step} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              uploadStep === item.step ? 'bg-primary text-primary-foreground border-primary' :
              ['metadata', 'compliance', 'processing'].indexOf(uploadStep) > ['select', 'metadata', 'compliance', 'processing'].indexOf(item.step) - 1 ? 'bg-green-600 text-white border-green-600' :
              'border-muted-foreground text-muted-foreground'
            }`}>
              <span className="text-sm">{item.icon}</span>
            </div>
            <span className="ml-2 text-sm font-medium">{item.label}</span>
            {index < 3 && <div className="w-8 h-0.5 bg-muted-foreground mx-4" />}
          </div>
        ))}
      </div>

      {/* File Selection */}
      {uploadStep === 'select' && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Direct File Upload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground rounded-lg p-8 text-center">
                <div className="space-y-4">
                  <div className="text-4xl">📤</div>
                  <div>
                    <p className="text-lg font-medium">Drop files here or click to browse</p>
                    <p className="text-sm text-muted-foreground">Supports video, images, and audio files</p>
                  </div>
                  <Input
                    type="file"
                    multiple
                    accept="video/*,image/*,audio/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <Label htmlFor="file-upload">
                    <Button variant="outline" className="cursor-pointer">
                      Select Files
                    </Button>
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cloud Storage Import</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Import directly from your connected cloud storage services
              </p>
              
              <div className="space-y-2">
                {sourceOptions.slice(1).map((source) => (
                  <Button
                    key={source.value}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setMetadata({...metadata, source: source.value as SourceType});
                      setUploadStep('metadata');
                    }}
                  >
                    <span className="mr-2">{source.icon}</span>
                    {source.label}
                  </Button>
                ))}
              </div>

              <Alert>
                <AlertDescription>
                  Cloud storage connections require OAuth authentication and appropriate permissions.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Metadata Form */}
      {uploadStep === 'metadata' && (
        <Card>
          <CardHeader>
            <CardTitle>Content Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Files</Label>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Content Title *</Label>
              <Input
                id="title"
                value={metadata.title}
                onChange={(e) => setMetadata({...metadata, title: e.target.value})}
                placeholder="Enter a descriptive title for your content"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={metadata.description}
                onChange={(e) => setMetadata({...metadata, description: e.target.value})}
                placeholder="Add a description, tags, or notes about this content"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Source Type</Label>
              <Select value={metadata.source} onValueChange={(value) => setMetadata({...metadata, source: value as SourceType})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sourceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center space-x-2">
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-2">
              <Button onClick={() => setUploadStep('select')} variant="outline">
                Back
              </Button>
              <Button onClick={handleMetadataSubmit} className="flex-1">
                Continue to Compliance
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compliance Form */}
      {uploadStep === 'compliance' && (
        <div className="space-y-4">
          <ComplianceForm onSubmit={handleComplianceSubmit} />
          
          <div className="flex space-x-2">
            <Button onClick={() => setUploadStep('metadata')} variant="outline">
              Back
            </Button>
          </div>
        </div>
      )}

      {/* Processing */}
      {uploadStep === 'processing' && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Upload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="text-6xl">⚙️</div>
              <div>
                <h3 className="text-lg font-medium">Processing Your Content</h3>
                <p className="text-muted-foreground">
                  AI enhancement, compliance verification, and derivative generation in progress
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Upload Progress</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-3" />
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <span className={uploadProgress > 20 ? '✅' : '⏳'}>
                  {uploadProgress > 20 ? '✅' : '⏳'}
                </span>
                <span>File upload and validation</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={uploadProgress > 40 ? '✅' : '⏳'}>
                  {uploadProgress > 40 ? '✅' : '⏳'}
                </span>
                <span>Compliance verification</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={uploadProgress > 60 ? '✅' : '⏳'}>
                  {uploadProgress > 60 ? '✅' : '⏳'}
                </span>
                <span>AI content analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={uploadProgress > 80 ? '✅' : '⏳'}>
                  {uploadProgress > 80 ? '✅' : '⏳'}
                </span>
                <span>Generating derivatives (GIFs, thumbnails, trailers)</span>
              </div>
            </div>

            {uploadProgress >= 100 && (
              <Alert>
                <AlertDescription>
                  Upload completed successfully! Redirecting to dashboard...
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}