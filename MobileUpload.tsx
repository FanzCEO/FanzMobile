import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import MediaProcessingStatus from '@/components/MediaProcessingStatus';
import PlatformSelector from '@/components/PlatformSelector';
import { mediaProcessor, ProcessingOptions } from '@/lib/mediaProcessing';

interface MobileUploadProps {
  onPageChange: (page: string) => void;
}

export default function MobileUpload({ onPageChange }: MobileUploadProps) {
  const [uploadStep, setUploadStep] = useState<'capture' | 'metadata' | 'platforms' | 'processing' | 'complete'>('capture');
  const [hasCostar, setHasCostar] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [processingOptions, setProcessingOptions] = useState<ProcessingOptions>({
    dmcaProtection: true,
    copyrightRegistration: true,
    qualityPreset: 'balanced',
    outputFormats: ['MP4', 'WebM', 'JPEG', 'WebP'],
    resolutions: ['4K', '1080p', '720p', '480p'],
    enableAIEnhancement: true
  });

  const handleCameraCapture = () => {
    const mockFile = new File(['mock video data'], 'camera_capture.mp4', { type: 'video/mp4' });
    setSelectedMedia(mockFile);
    setUploadStep('metadata');
  };

  const handleGallerySelect = () => {
    const mockFile = new File(['mock image data'], 'gallery_photo.jpg', { type: 'image/jpeg' });
    setSelectedMedia(mockFile);
    setUploadStep('metadata');
  };

  const handleStartProcessing = async () => {
    if (!selectedMedia || selectedProfiles.length === 0) return;
    
    setUploadStep('processing');
    
    try {
      const job = await mediaProcessor.processMedia(selectedMedia, processingOptions);
      setProcessingJobId(job.id);
    } catch (error) {
      console.error('Failed to start processing:', error);
    }
  };

  const handleProcessingComplete = () => {
    setUploadStep('complete');
    setTimeout(() => {
      onPageChange('dashboard');
    }, 2000);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => onPageChange('dashboard')}>
          ← Back
        </Button>
        <h1 className="text-lg font-semibold">Upload Content</h1>
        <div className="w-16" />
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center space-x-2 mb-6">
        {['📷', '📝', '🎯', '⚙️', '✅'].map((icon, index) => (
          <div key={index} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
              index <= ['capture', 'metadata', 'platforms', 'processing', 'complete'].indexOf(uploadStep) 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {icon}
            </div>
            {index < 4 && <div className="w-4 h-0.5 bg-muted mx-1" />}
          </div>
        ))}
      </div>

      {/* Capture Media */}
      {uploadStep === 'capture' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <div className="text-4xl">📷</div>
              <h3 className="text-lg font-semibold">Capture or Select Media</h3>
              <p className="text-sm text-muted-foreground">
                Professional processing with forensic protection included
              </p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button 
              onClick={handleCameraCapture}
              className="w-full h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📸</span>
                <div className="text-left">
                  <div className="font-semibold">Take Photo/Video</div>
                  <div className="text-xs opacity-90">4K recording with AI enhancement</div>
                </div>
              </div>
            </Button>

            <Button 
              onClick={handleGallerySelect}
              variant="outline"
              className="w-full h-16"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🖼️</span>
                <div className="text-left">
                  <div className="font-semibold">Choose from Gallery</div>
                  <div className="text-xs text-muted-foreground">Auto-optimize existing media</div>
                </div>
              </div>
            </Button>

            <Button 
              variant="outline"
              className="w-full h-16"
              onClick={() => {
                const mockFile = new File(['mock cloud data'], 'cloud_sync.mp4', { type: 'video/mp4' });
                setSelectedMedia(mockFile);
                setUploadStep('metadata');
              }}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">☁️</span>
                <div className="text-left">
                  <div className="font-semibold">Cloud Sync</div>
                  <div className="text-xs text-muted-foreground">Professional cloud storage</div>
                </div>
              </div>
            </Button>
          </div>

          <Alert>
            <AlertDescription className="text-xs">
              🛡️ All uploads include forensic watermarking and DMCA protection powered by FANZ Signature™
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Metadata & Processing Options */}
      {uploadStep === 'metadata' && (
        <div className="space-y-4">
          {selectedMedia && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xl">
                    📷
                  </div>
                  <div>
                    <p className="font-medium">{selectedMedia.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedMedia.type} • {(selectedMedia.size / 1024 / 1024).toFixed(2)}MB
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            <div>
              <Label htmlFor="title" className="text-sm font-medium">Title</Label>
              <Input 
                id="title"
                placeholder="Add a catchy title..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="caption" className="text-sm font-medium">Caption</Label>
              <Textarea 
                id="caption"
                placeholder="Write your caption... #hashtags"
                rows={3}
                className="mt-1"
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-muted-foreground">0/280 characters</span>
                <Button variant="ghost" size="sm" className="text-xs">
                  🤖 AI Suggest
                </Button>
              </div>
            </div>
          </div>

          {/* Processing Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">🎬 Processing Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">DMCA Protection</p>
                    <p className="text-xs text-muted-foreground">Forensic watermarking & takedown protection</p>
                  </div>
                  <Switch 
                    checked={processingOptions.dmcaProtection} 
                    onCheckedChange={(checked) => 
                      setProcessingOptions(prev => ({ ...prev, dmcaProtection: checked }))
                    } 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">AI Enhancement</p>
                    <p className="text-xs text-muted-foreground">Upscaling, noise reduction, color correction</p>
                  </div>
                  <Switch 
                    checked={processingOptions.enableAIEnhancement} 
                    onCheckedChange={(checked) => 
                      setProcessingOptions(prev => ({ ...prev, enableAIEnhancement: checked }))
                    } 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Co-star in content?</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Requires additional verification</span>
                  <Switch checked={hasCostar} onCheckedChange={setHasCostar} />
                </div>
              </div>

              {hasCostar && (
                <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                  <Input placeholder="Co-star name" />
                  <Input placeholder="Email or @username" />
                  <Alert>
                    <AlertDescription className="text-xs">
                      Verification link will be sent automatically for compliance.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setUploadStep('capture')}>
              Back
            </Button>
            <Button className="flex-1" onClick={() => setUploadStep('platforms')}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Platform Selection */}
      {uploadStep === 'platforms' && (
        <div className="space-y-4">
          <PlatformSelector
            selectedProfiles={selectedProfiles}
            onSelectionChange={setSelectedProfiles}
            showEarnings={true}
          />

          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setUploadStep('metadata')}>
              Back
            </Button>
            <Button 
              className="flex-1" 
              onClick={handleStartProcessing}
              disabled={selectedProfiles.length === 0}
            >
              Start Processing
            </Button>
          </div>
        </div>
      )}

      {/* Processing Status */}
      {uploadStep === 'processing' && processingJobId && (
        <div className="space-y-4">
          <MediaProcessingStatus 
            jobId={processingJobId} 
            onComplete={handleProcessingComplete}
          />
          
          <Alert>
            <AlertDescription className="text-xs">
              <div className="space-y-1">
                <p className="font-medium">🔐 Advanced Security Features Active:</p>
                <p>• Forensic watermarking with unique signature</p>
                <p>• Content fingerprinting for piracy detection</p>
                <p>• Automated DMCA registration and monitoring</p>
                <p>• Real-time content tracking across platforms</p>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Complete */}
      {uploadStep === 'complete' && (
        <div className="space-y-6 text-center">
          <div className="space-y-4">
            <div className="text-6xl">🎉</div>
            <div>
              <h3 className="text-lg font-semibold">Upload Complete!</h3>
              <p className="text-sm text-muted-foreground">
                Content uploaded to {selectedProfiles.length} profile{selectedProfiles.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="space-y-2 text-left">
                <div className="flex items-center space-x-2 text-sm">
                  <span>✅</span>
                  <span>Uploaded to {selectedProfiles.length} platform profile{selectedProfiles.length > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span>✅</span>
                  <span>Forensic signature applied</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span>✅</span>
                  <span>DMCA protection activated</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span>✅</span>
                  <span>AI marketing bots notified</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <AlertDescription className="text-center text-xs">
              Protected by <strong>FANZ Signature™</strong> - Advanced content protection and tracking system
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}