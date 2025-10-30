import { Platform } from 'react-native';

// Supabase configuration
export const SUPABASE_URL = process.env.SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// Storage buckets
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  CONTENT: 'content',
  THUMBNAILS: 'thumbnails',
  VIDEOS: 'videos',
  IMAGES: 'images',
  DOCUMENTS: 'documents',
} as const;

// Supabase realtime config
export const REALTIME_CONFIG = {
  PRESENCE_KEY: 'fanz-mobile-presence',
  BROADCAST_CHANNEL: 'fanz-notifications',
};

// Storage policies
export const STORAGE_CONFIG = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf'],
};

// Edge Function URLs (if using Supabase Edge Functions)
export const EDGE_FUNCTIONS = {
  PROCESS_VIDEO: `${SUPABASE_URL}/functions/v1/process-video`,
  GENERATE_THUMBNAIL: `${SUPABASE_URL}/functions/v1/generate-thumbnail`,
  AI_MODERATE_CONTENT: `${SUPABASE_URL}/functions/v1/moderate-content`,
  NOTIFY_USER: `${SUPABASE_URL}/functions/v1/notify-user`,
};

// Database table names
export const TABLES = {
  USERS: 'users',
  PROFILES: 'profiles',
  POSTS: 'posts',
  COMMENTS: 'comments',
  LIKES: 'likes',
  FOLLOWS: 'follows',
  SUBSCRIPTIONS: 'subscriptions',
  MESSAGES: 'messages',
  NOTIFICATIONS: 'notifications',
  CONTENT: 'content',
  TRANSACTIONS: 'transactions',
} as const;

// RLS (Row Level Security) helper
export const RLS_POLICIES = {
  PUBLIC_READ: 'public_read',
  USER_READ_OWN: 'user_read_own',
  USER_WRITE_OWN: 'user_write_own',
  ADMIN_ALL: 'admin_all',
};

export default {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  STORAGE_BUCKETS,
  REALTIME_CONFIG,
  STORAGE_CONFIG,
  EDGE_FUNCTIONS,
  TABLES,
  RLS_POLICIES,
};
