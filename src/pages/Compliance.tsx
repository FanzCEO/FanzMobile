import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { mockAssets, mockCompliance, ComplianceRecord } from '@/lib/mockData';

interface ComplianceProps {
  onPageChange: (page: string) => void;
}

export default function Compliance({ onPageChange }: ComplianceProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-600';
      case 'sent': return 'bg-blue-600';
      case 'pending': return 'bg-yellow-600';
      case 'failed': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const complianceStats = [
    { label: 'Total Records', value: '24', icon: '📋' },
    { label: 'Verified', value: '21', icon: '✅' },
    { label: 'Pending', value: '2', icon: '⏳' },
    { label: 'Failed', value: '1', icon: '❌' }
  ];

  // Mock compliance records for demonstration
  const allComplianceRecords: ComplianceRecord[] = [
    ...mockCompliance,
    {
      id: '2',
      asset_id: '2',
      invite_status: 'sent',
      verify_token: 'token_abc123',
      provider: 'VerifyMy',
      created_at: '2024-10-29T08:16:00Z'
    },
    {
      id: '3',
      asset_id: '1',
      invite_status: 'verified',
      verified_at: '2024-10-28T15:30:00Z',
      provider: 'manual',
      created_at: '2024-10-28T15:00:00Z'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Compliance Management</h1>
          <p className="text-muted-foreground">18 U.S.C. §2257 Record Keeping & Co-star Verification</p>
        </div>
        <Button onClick={() => onPageChange('upload')}>
          <span className="mr-2">📤</span>
          New Upload
        </Button>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-4 gap-4">
        {complianceStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{stat.icon}</span>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Compliance Alert */}
      <Alert>
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">18 U.S.C. §2257 Compliance Requirements:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>All performers must be verified as 18+ years of age</li>
              <li>Valid government-issued photo identification required</li>
              <li>Records must be maintained for content lifetime + 7 years</li>
              <li>Co-star verification mandatory for collaborative content</li>
              <li>Custodian of records information must be accessible</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      {/* Compliance Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Co-star</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Verified Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allComplianceRecords.map((record) => {
                const asset = mockAssets.find(a => a.id === record.asset_id);
                return (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <img 
                          src={asset?.thumbnail || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100'} 
                          alt={asset?.title}
                          className="w-10 h-10 rounded object-cover"
                        />
                        <span className="font-medium">{asset?.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.costar_user_id ? (
                        <div>
                          <p className="font-medium">@costar_user</p>
                          <p className="text-xs text-muted-foreground">Verified User</p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium">External Co-star</p>
                          <p className="text-xs text-muted-foreground">Verification Required</p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(record.invite_status)}>
                        {record.invite_status}
                      </Badge>
                    </TableCell>
                    <TableCell>{record.provider}</TableCell>
                    <TableCell>
                      {record.verified_at ? 
                        new Date(record.verified_at).toLocaleDateString() : 
                        '-'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {record.invite_status === 'pending' && (
                          <Button size="sm" variant="outline">
                            Resend Invite
                          </Button>
                        )}
                        <Button size="sm" variant="ghost">
                          View Details
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Manual Verification */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            For co-stars who cannot complete automated verification, manual verification can be processed.
          </p>
          
          <div className="grid grid-cols-3 gap-4">
            <Input placeholder="Co-star Email" />
            <Input placeholder="Asset ID" />
            <Button>Start Manual Verification</Button>
          </div>

          <Alert>
            <AlertDescription>
              Manual verification requires uploading government-issued photo ID and completing 
              additional documentation. This process typically takes 24-48 hours for review.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Compliance Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: 'Verification completed', user: '@costar_user', time: '2 hours ago', status: 'success' },
              { action: 'Invite sent', user: 'external@email.com', time: '4 hours ago', status: 'info' },
              { action: 'Manual verification started', user: '@another_user', time: '1 day ago', status: 'warning' },
              { action: 'Verification failed', user: 'failed@email.com', time: '2 days ago', status: 'error' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'success' ? 'bg-green-600' :
                    activity.status === 'info' ? 'bg-blue-600' :
                    activity.status === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
                  }`} />
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.user}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}