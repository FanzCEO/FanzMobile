// Data Layer - Connects to Supabase for real data
// This file maintains backward compatibility while switching to real data sources

import { db } from './supabase';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface User {
  id: string;
  handle: string;
  email: string;
  phone: string;
  role: 'creator' | 'admin';
  verified_at: string | null;
  platform: string;
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

export interface Platform {
  id: string;
  name: string;
  domain: string;
  color: string;
  users?: string;
  status: string;
  branding: {
    tone: string;
    accent: string;
  };
}

export interface SocialChannel {
  name: string;
  icon: string;
  connected: boolean;
}

// ============================================
// DATA FETCHERS (Replace static data)
// ============================================

// Fetch current user from session
export async function getCurrentUser(): Promise<User | null> {
  const { user } = await db.users.getById('current');
  if (!user) return null;
  
  return {
    id: user.id,
    handle: user.handle || '',
    email: user.email,
    phone: '',
    role: 'creator',
    verified_at: user.verified_at,
    platform: 'BoyFanz' // Will be determined by user's primary platform
  };
}

// Fetch all platforms from database
export async function getPlatforms(): Promise<Platform[]> {
  const { data, error } = await db.platforms.getAll();
  
  if (error || !data) {
    console.error('Failed to fetch platforms:', error);
    return defaultPlatforms;
  }
  
  return data.map(p => ({
    id: p.id,
    name: p.name,
    domain: p.domain,
    color: getColorClass(p.branding?.accent as string),
    status: p.status,
    branding: p.branding as { tone: string; accent: string }
  }));
}

// Fetch user's content/assets
export async function getUserAssets(userId: string): Promise<Asset[]> {
  const { data, error } = await db.content.getByCreator(userId);
  
  if (error || !data) {
    console.error('Failed to fetch assets:', error);
    return [];
  }
  
  return data.map(c => ({
    id: c.id,
    owner_id: c.creator_id,
    title: c.title || 'Untitled',
    storage_key: '',
    mime: c.content_type,
    status: c.status as Asset['status'],
    thumbnail: '', // Would come from content_media
    created_at: c.created_at
  }));
}

// Fetch scheduled posts
export async function getScheduledPosts(creatorId: string): Promise<Post[]> {
  const { data, error } = await db.scheduledPosts.getByCreator(creatorId);
  
  if (error || !data) {
    console.error('Failed to fetch scheduled posts:', error);
    return [];
  }
  
  return data.map(p => ({
    id: p.id,
    asset_id: p.content_id || '',
    caption: p.caption,
    publish_at: p.scheduled_at,
    status: p.status as Post['status'],
    created_at: p.created_at
  }));
}

// Helper: Convert hex color to Tailwind class
function getColorClass(hexColor: string | undefined): string {
  if (!hexColor) return 'bg-gray-600';
  
  const colorMap: Record<string, string> = {
    '#00E1FF': 'bg-blue-600',
    '#FF2E79': 'bg-pink-600',
    '#2ECC71': 'bg-green-600',
    '#F39C12': 'bg-orange-600',
    '#D4AF37': 'bg-yellow-600',
    '#FF0000': 'bg-red-600',
    '#34495E': 'bg-slate-600',
    '#E74C3C': 'bg-red-500',
    '#FF8AD6': 'bg-pink-400',
    '#8E44AD': 'bg-purple-600',
    '#9B59B6': 'bg-purple-500',
    '#C0392B': 'bg-red-700'
  };
  
  return colorMap[hexColor] || 'bg-gray-600';
}

// ============================================
// DEFAULT/FALLBACK DATA (Used when DB unavailable)
// ============================================

// Default user (for offline/demo mode)
export const mockUser: User = {
  id: 'demo_user',
  handle: '@creator',
  email: 'demo@fanz.com',
  phone: '',
  role: 'creator',
  verified_at: null,
  platform: 'BoyFanz'
};

// Default platforms (fallback when DB unavailable)
const defaultPlatforms: Platform[] = [
  { id: 'boyfanz', name: 'BoyFanz', domain: 'boyfanz.fmd.solutions', color: 'bg-blue-600', status: 'active', branding: { tone: 'electric male energy', accent: '#00E1FF' } },
  { id: 'girlfanz', name: 'GirlFanz', domain: 'girlfanz.fmd.solutions', color: 'bg-pink-600', status: 'active', branding: { tone: 'global mainstream', accent: '#FF2E79' } },
  { id: 'pupfanz', name: 'PupFanz', domain: 'pupfanz.fmd.solutions', color: 'bg-purple-600', status: 'active', branding: { tone: 'community & loyalty', accent: '#2ECC71' } }
];

// Export for backward compatibility
export const platforms = defaultPlatforms.map(p => ({
  name: p.name,
  color: p.color,
  users: '0' // Will be fetched from analytics
}));

// Default assets (empty - will be populated from DB)
export const mockAssets: Asset[] = [];

// Default jobs (empty - will be populated from DB)
export const mockJobs: ProcessingJob[] = [];

// Default posts (empty - will be populated from DB)
export const mockPosts: Post[] = [];

// Default compliance records (empty - will be populated from DB)
export const mockCompliance: ComplianceRecord[] = [];

// Social channels configuration
export const socialChannels: SocialChannel[] = [
  { name: 'Twitter/X', icon: '𝕏', connected: false },
  { name: 'Reddit', icon: '🤖', connected: false },
  { name: 'Bluesky', icon: '🦋', connected: false },
  { name: 'Instagram', icon: '📷', connected: false },
  { name: 'TikTok', icon: '🎵', connected: false }
];

// ============================================
// REACTIVE DATA STORE
// ============================================

interface DataStore {
  user: User | null;
  platforms: Platform[];
  assets: Asset[];
  jobs: ProcessingJob[];
  posts: Post[];
  isLoading: boolean;
  isInitialized: boolean;
}

class FanzDataStore {
  private store: DataStore = {
    user: null,
    platforms: defaultPlatforms,
    assets: [],
    jobs: [],
    posts: [],
    isLoading: true,
    isInitialized: false
  };
  
  private listeners: Set<() => void> = new Set();
  
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private notify() {
    this.listeners.forEach(listener => listener());
  }
  
  async initialize(userId?: string) {
    if (this.store.isInitialized) return;
    
    this.store.isLoading = true;
    this.notify();
    
    try {
      // Fetch platforms
      const platforms = await getPlatforms();
      this.store.platforms = platforms;
      
      // Fetch user data if userId provided
      if (userId) {
        const [assets, posts] = await Promise.all([
          getUserAssets(userId),
          getScheduledPosts(userId)
        ]);
        
        this.store.assets = assets;
        this.store.posts = posts;
      }
      
      this.store.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize data store:', error);
    } finally {
      this.store.isLoading = false;
      this.notify();
    }
  }
  
  getState() {
    return this.store;
  }
  
  setUser(user: User | null) {
    this.store.user = user;
    this.notify();
  }
  
  addAsset(asset: Asset) {
    this.store.assets = [asset, ...this.store.assets];
    this.notify();
  }
  
  updateAsset(id: string, updates: Partial<Asset>) {
    this.store.assets = this.store.assets.map(a => 
      a.id === id ? { ...a, ...updates } : a
    );
    this.notify();
  }
  
  addJob(job: ProcessingJob) {
    this.store.jobs = [job, ...this.store.jobs];
    this.notify();
  }
  
  updateJob(id: string, updates: Partial<ProcessingJob>) {
    this.store.jobs = this.store.jobs.map(j => 
      j.id === id ? { ...j, ...updates } : j
    );
    this.notify();
  }
}

export const dataStore = new FanzDataStore();
