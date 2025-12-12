// Supabase Client Configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Supabase Configuration
// The URL can be either the default Supabase URL or your custom domain
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mcayxybcgxhfttvwmhgm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate configuration
if (!supabaseAnonKey && import.meta.env.PROD) {
  console.error('❌ VITE_SUPABASE_ANON_KEY is required in production');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-app-name': 'fanz-mobile'
    }
  }
});

// Auth helpers
export const auth = {
  signUp: async (email: string, password: string, metadata?: Record<string, unknown>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  signInWithOAuth: async (provider: 'twitter' | 'google' | 'apple') => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },

  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });
    return { data, error };
  }
};

// Database query helpers
export const db = {
  // Users
  users: {
    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      return { data, error };
    },
    
    getByEmail: async (email: string) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      return { data, error };
    },

    update: async (id: string, updates: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      return { data, error };
    },

    getCurrent: async () => {
      const { user } = await auth.getUser();
      if (!user) return { data: null, error: new Error('Not authenticated') };
      return db.users.getById(user.id);
    }
  },

  // Platforms
  platforms: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('platforms')
        .select('*')
        .eq('status', 'active')
        .order('name');
      return { data, error };
    },

    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('platforms')
        .select('*')
        .eq('id', id)
        .single();
      return { data, error };
    },

    getByDomain: async (domain: string) => {
      const { data, error } = await supabase
        .from('platforms')
        .select('*')
        .eq('domain', domain)
        .single();
      return { data, error };
    }
  },

  // Creator Profiles
  creators: {
    getByUserId: async (userId: string) => {
      const { data, error } = await supabase
        .from('creators')
        .select('*, platforms(*)')
        .eq('user_id', userId);
      return { data, error };
    },

    getProfile: async (creatorId: string) => {
      const { data, error } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('creator_id', creatorId)
        .single();
      return { data, error };
    },

    updateProfile: async (creatorId: string, updates: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('creator_profiles')
        .update(updates)
        .eq('creator_id', creatorId)
        .select()
        .single();
      return { data, error };
    },

    getEarningsSummary: async (creatorId: string) => {
      const { data, error } = await supabase
        .from('creator_earnings_summary')
        .select('*')
        .eq('creator_id', creatorId)
        .single();
      return { data, error };
    }
  },

  // Content
  content: {
    getByCreator: async (creatorId: string, limit = 20) => {
      const { data, error } = await supabase
        .from('content_posts')
        .select('*, content_media(*)')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false })
        .limit(limit);
      return { data, error };
    },

    getById: async (contentId: string) => {
      const { data, error } = await supabase
        .from('content_posts')
        .select('*, content_media(*)')
        .eq('id', contentId)
        .single();
      return { data, error };
    },

    create: async (content: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('content_posts')
        .insert(content)
        .select()
        .single();
      return { data, error };
    },

    update: async (contentId: string, updates: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('content_posts')
        .update(updates)
        .eq('id', contentId)
        .select()
        .single();
      return { data, error };
    },

    delete: async (contentId: string) => {
      const { error } = await supabase
        .from('content_posts')
        .delete()
        .eq('id', contentId);
      return { error };
    },

    getProtectedCount: async (creatorId: string) => {
      const { count, error } = await supabase
        .from('content_posts')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creatorId)
        .not('forensic_signature_id', 'is', null);
      return { count, error };
    }
  },

  // Scheduled Posts
  scheduledPosts: {
    getByCreator: async (creatorId: string) => {
      const { data, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .eq('creator_id', creatorId)
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true });
      return { data, error };
    },

    create: async (post: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('scheduled_posts')
        .insert(post)
        .select()
        .single();
      return { data, error };
    },

    update: async (postId: string, updates: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('scheduled_posts')
        .update(updates)
        .eq('id', postId)
        .select()
        .single();
      return { data, error };
    },

    delete: async (postId: string) => {
      const { error } = await supabase
        .from('scheduled_posts')
        .delete()
        .eq('id', postId);
      return { error };
    }
  },

  // Analytics
  analytics: {
    getCreatorStats: async (creatorId: string, days = 30) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('creator_analytics')
        .select('*')
        .eq('creator_id', creatorId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });
      return { data, error };
    },

    getEarnings: async (creatorId: string, days = 30) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('creator_earnings_records')
        .select('*')
        .eq('creator_id', creatorId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });
      return { data, error };
    },

    getTodayEarnings: async (creatorId: string) => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('creator_earnings_records')
        .select('amount')
        .eq('creator_id', creatorId)
        .gte('created_at', today);
      
      const total = data?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
      return { total, error };
    },

    getPlatformMetrics: async () => {
      const { data, error } = await supabase
        .from('platform_metrics')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(1);
      return { data: data?.[0], error };
    }
  },

  // DMCA Records
  dmca: {
    getByCreator: async (creatorId: string) => {
      const { data, error } = await supabase
        .from('dmca_requests')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });
      return { data, error };
    },

    create: async (dmcaRequest: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('dmca_requests')
        .insert(dmcaRequest)
        .select()
        .single();
      return { data, error };
    },

    getStats: async (creatorId: string) => {
      const { data, error } = await supabase
        .from('dmca_requests')
        .select('status')
        .eq('creator_id', creatorId);
      
      if (error) return { data: null, error };
      
      const stats = {
        total: data?.length || 0,
        pending: data?.filter(d => d.status === 'pending').length || 0,
        resolved: data?.filter(d => d.status === 'resolved').length || 0,
        successRate: 0
      };
      
      if (stats.total > 0) {
        stats.successRate = (stats.resolved / stats.total) * 100;
      }
      
      return { data: stats, error: null };
    }
  },

  // Followers
  followers: {
    getCount: async (creatorId: string) => {
      const { count, error } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creatorId);
      return { count, error };
    },

    getNewToday: async (creatorId: string) => {
      const today = new Date().toISOString().split('T')[0];
      
      const { count, error } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creatorId)
        .gte('created_at', today);
      return { count, error };
    }
  },

  // Messages
  messages: {
    getConversations: async (userId: string) => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*, messages(content, created_at, sender_id)')
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
        .order('updated_at', { ascending: false });
      return { data, error };
    },

    getMessages: async (conversationId: string, limit = 50) => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limit);
      return { data, error };
    },

    send: async (message: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('messages')
        .insert(message)
        .select()
        .single();
      return { data, error };
    }
  },

  // Admin
  admin: {
    getSystemStats: async () => {
      const [users, content, revenue] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('content_posts').select('id', { count: 'exact', head: true }),
        supabase.from('platform_revenue').select('amount').order('created_at', { ascending: false }).limit(30)
      ]);

      return {
        totalUsers: users.count || 0,
        totalContent: content.count || 0,
        totalRevenue: revenue.data?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0
      };
    },

    getRecentUsers: async (limit = 10) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      return { data, error };
    },

    getPlatformDistribution: async () => {
      const { data, error } = await supabase
        .from('platform_memberships')
        .select('platform_id, platforms(name, branding)')
        .order('created_at', { ascending: false });
      return { data, error };
    }
  }
};

// Storage helpers
export const storage = {
  upload: async (bucket: string, path: string, file: File, options?: { upsert?: boolean }) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: options?.upsert || false
      });
    return { data, error };
  },

  getPublicUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  getSignedUrl: async (bucket: string, path: string, expiresIn = 3600) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
    return { url: data?.signedUrl, error };
  },

  delete: async (bucket: string, paths: string[]) => {
    const { error } = await supabase.storage.from(bucket).remove(paths);
    return { error };
  },

  list: async (bucket: string, folder?: string) => {
    const { data, error } = await supabase.storage.from(bucket).list(folder);
    return { data, error };
  }
};

// Realtime subscriptions
export const realtime = {
  subscribeToMessages: (conversationId: string, callback: (payload: unknown) => void) => {
    return supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, callback)
      .subscribe();
  },

  subscribeToNotifications: (userId: string, callback: (payload: unknown) => void) => {
    return supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, callback)
      .subscribe();
  },

  subscribeToEarnings: (creatorId: string, callback: (payload: unknown) => void) => {
    return supabase
      .channel(`earnings:${creatorId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'creator_earnings_records',
        filter: `creator_id=eq.${creatorId}`
      }, callback)
      .subscribe();
  },

  unsubscribe: (channel: ReturnType<typeof supabase.channel>) => {
    return supabase.removeChannel(channel);
  }
};

export default supabase;
