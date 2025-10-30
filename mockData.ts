export interface User {
  id: string;
  handle: string;
  email: string;
  phone: string;
  role: 'creator' | 'admin';
  verified_at: string | null;
  platform: 'BoyFanz' | 'GirlFanz' | 'PupFanz';
}

export interface Asset {
  id: string;
  owner_id: string;
  title: string;
  storage_key: string;
  mime: string;
  duration?: number;
  width?: number;
  height?: number;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  thumbnail?: string;
  created_at: string;
}

export interface Upload {
  id: string;
  asset_id: string;
  title: string;
  has_costar: boolean;
  costar_name?: string;
  costar_email?: string;
  costar_phone?: string;
  costar_handle?: string;
  source: 'google_drive' | 'icloud' | 'dropbox' | 's3' | 'minio' | 'direct';
  source_ref?: string;
  created_at: string;
}

export interface ComplianceRecord {
  id: string;
  asset_id: string;
  costar_user_id?: string;
  invite_status: 'pending' | 'sent' | 'verified' | 'failed';
  verify_token?: string;
  verified_at?: string;
  provider: 'VerifyMy' | 'manual';
  provider_ref?: string;
  created_at: string;
}

export interface Post {
  id: string;
  asset_id: string;
  caption: string;
  publish_at: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

export interface PostTarget {
  id: string;
  post_id: string;
  channel: 'twitter' | 'reddit' | 'bluesky' | 'instagram' | 'tiktok';
  status: 'pending' | 'published' | 'failed';
  external_ref?: string;
  created_at: string;
}

export interface ProcessingJob {
  id: string;
  type: 'ingest' | 'transcode' | 'generate_derivatives' | 'ai_enhance' | 'schedule_publish' | 'notify';
  asset_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  created_at: string;
  updated_at: string;
}

// Mock data
export const mockUser: User = {
  id: '1',
  handle: '@alexcreator',
  email: 'alex@example.com',
  phone: '+1234567890',
  role: 'creator',
  verified_at: '2024-10-15T10:00:00Z',
  platform: 'BoyFanz'
};

export const mockAssets: Asset[] = [
  {
    id: '1',
    owner_id: '1',
    title: 'Beach Workout Session',
    storage_key: 'assets/beach-workout.mp4',
    mime: 'video/mp4',
    duration: 180,
    width: 1920,
    height: 1080,
    status: 'ready',
    thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
    created_at: '2024-10-28T14:30:00Z'
  },
  {
    id: '2',
    owner_id: '1',
    title: 'Morning Routine',
    storage_key: 'assets/morning-routine.mp4',
    mime: 'video/mp4',
    duration: 240,
    width: 1920,
    height: 1080,
    status: 'processing',
    thumbnail: 'https://images.unsplash.com/photo-1506629905607-d9c297d3d45b?w=400',
    created_at: '2024-10-29T08:15:00Z'
  },
  {
    id: '3',
    owner_id: '1',
    title: 'Collaboration Content',
    storage_key: 'assets/collab-content.mp4',
    mime: 'video/mp4',
    duration: 300,
    width: 1920,
    height: 1080,
    status: 'ready',
    thumbnail: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400',
    created_at: '2024-10-27T16:45:00Z'
  }
];

export const mockJobs: ProcessingJob[] = [
  {
    id: '1',
    type: 'ai_enhance',
    asset_id: '2',
    status: 'processing',
    progress: 75,
    created_at: '2024-10-29T08:16:00Z',
    updated_at: '2024-10-29T08:20:00Z'
  },
  {
    id: '2',
    type: 'generate_derivatives',
    asset_id: '2',
    status: 'completed',
    progress: 100,
    created_at: '2024-10-29T08:15:30Z',
    updated_at: '2024-10-29T08:18:00Z'
  }
];

export const mockPosts: Post[] = [
  {
    id: '1',
    asset_id: '1',
    caption: '🔥 New beach workout session is live! Check out my latest fitness routine with some amazing ocean views. #fitness #beach #workout',
    publish_at: '2024-10-30T18:00:00Z',
    status: 'scheduled',
    created_at: '2024-10-28T15:00:00Z'
  },
  {
    id: '2',
    asset_id: '3',
    caption: '✨ Amazing collaboration with @partner! This was so much fun to create. Hope you enjoy! #collab #content #exclusive',
    publish_at: '2024-10-29T20:00:00Z',
    status: 'draft',
    created_at: '2024-10-27T17:00:00Z'
  }
];

export const mockCompliance: ComplianceRecord[] = [
  {
    id: '1',
    asset_id: '3',
    invite_status: 'verified',
    verified_at: '2024-10-27T18:00:00Z',
    provider: 'VerifyMy',
    provider_ref: 'vm_12345',
    created_at: '2024-10-27T17:30:00Z'
  }
];

export const platforms = [
  { name: 'BoyFanz', color: 'bg-blue-600', users: '2.1M' },
  { name: 'GirlFanz', color: 'bg-pink-600', users: '3.8M' },
  { name: 'PupFanz', color: 'bg-purple-600', users: '1.2M' }
];

export const socialChannels = [
  { name: 'Twitter/X', icon: '𝕏', connected: true },
  { name: 'Reddit', icon: '🤖', connected: true },
  { name: 'Bluesky', icon: '🦋', connected: false },
  { name: 'Instagram', icon: '📷', connected: true },
  { name: 'TikTok', icon: '🎵', connected: false }
];