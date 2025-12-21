import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { platformManager, CloudStorage } from '@/lib/platformConnections';

export default function CloudStorageManager() {
  const [storageData] = useState<CloudStorage[]>(platformManager.getCloudStorage());
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const storageStats = {
    totalStorage: '2.5 TB',
    usedStorage: '847 GB',
    usagePercentage: 34,
    filesCount: 1247,
    protectedFiles: 1247,
    backupStatus: 'Active'
  };

  const storageProviders = [
    { name: 'FANZ Cloud', usage: 60, color: 'bg-blue-600', features: ['Forensic Protection', 'DMCA Monitoring'] },
    { name: 'AWS S3', usage: 25, color: 'bg-orange-600', features: ['Global CDN', 'High Availability'] },
    { name: 'Google Cloud', usage: 10, color: 'bg-green-600', features: ['AI Processing', 'Analytics'] },
    { name: 'Azure', usage: 5, color: 'bg-purple-600', features: ['Enterprise Security', 'Compliance'] }
  ];

  const fileCategories = [
    { type: 'Videos (4K)', count: 47, size: '1.2 TB', icon: '🎬' },
    { type: 'Videos (HD)', count: 89, size: '450 GB', icon: '📹' },
    { type: 'Photos (RAW)', count: 234, size: '180 GB', icon: '📸' },
    { type: 'Photos (Processed)', count: 567, size: '89 GB', icon: '🖼️' },
    { type: 'Audio Files', count: 23, size: '12 GB', icon: '🎵' },
    { type: 'Documents', count: 287, size: '2.1 GB', icon: '📄' }
  ];

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'FANZ': return '🔐';
      case 'AWS': return '☁️';
      case 'Google': return '🌐';
      case 'Azure': return '🔷';
      default: return '💾';
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Cloud Storage</h1>
        <Button size="sm">
          + Upload Files
        </Button>
      </div>

      {/* Storage Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Storage Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Used: {storageStats.usedStorage}</span>
              <span>Total: {storageStats.totalStorage}</span>
            </div>
            <Progress value={storageStats.usagePercentage} className="h-3" />
            <div className="text-xs text-muted-foreground text-center">
              {storageStats.usagePercentage}% of storage used
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600">{storageStats.filesCount}</div>
              <div className="text-xs text-muted-foreground">Total Files</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">{storageStats.protectedFiles}</div>
              <div className="text-xs text-muted-foreground">Protected Files</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">{storageStats.backupStatus}</div>
              <div className="text-xs text-muted-foreground">Backup Status</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Providers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Storage Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {storageProviders.map((provider, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${provider.color}`} />
                  <span className="text-sm font-medium">{provider.name}</span>
                </div>
                <span className="text-sm font-semibold">{provider.usage}%</span>
              </div>
              <Progress value={provider.usage} className="h-2" />
              <div className="flex flex-wrap gap-1">
                {provider.features.map((feature, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* File Categories */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">File Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {fileCategories.map((category, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{category.icon}</span>
                <div>
                  <p className="font-medium text-sm">{category.type}</p>
                  <p className="text-xs text-muted-foreground">{category.count} files</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm">{category.size}</p>
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                  🛡️ Protected
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Files */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Recent Files</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {storageData.slice(0, 5).map((file) => (
            <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white">
                  {getProviderIcon(file.cloudProvider)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{file.fileName}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {file.cloudProvider}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(file.fileSize)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(file.uploadDate).toLocaleDateString()}
                    </span>
                  </div>
                  {file.metadata.forensicId && (
                    <div className="flex items-center space-x-1 mt-1">
                      <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                        🔐 Forensic ID: {file.metadata.forensicId.toString().substr(0, 8)}...
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm">
                  📤
                </Button>
                <Button variant="ghost" size="sm">
                  🔗
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Cloud Features */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Advanced Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 border rounded-lg text-center">
              <div className="text-lg">🔄</div>
              <div className="text-sm font-medium">Auto Sync</div>
              <div className="text-xs text-green-600">Active</div>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <div className="text-lg">🔐</div>
              <div className="text-sm font-medium">Encryption</div>
              <div className="text-xs text-green-600">AES-256</div>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <div className="text-lg">📊</div>
              <div className="text-sm font-medium">Analytics</div>
              <div className="text-xs text-blue-600">Real-time</div>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <div className="text-lg">🌐</div>
              <div className="text-sm font-medium">CDN</div>
              <div className="text-xs text-purple-600">Global</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security & Compliance */}
      <Alert>
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">🛡️ Enterprise Security Features:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <p>✅ End-to-end encryption</p>
              <p>✅ Forensic watermarking</p>
              <p>✅ DMCA protection</p>
              <p>✅ Compliance monitoring</p>
              <p>✅ Automated backups</p>
              <p>✅ Version control</p>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}