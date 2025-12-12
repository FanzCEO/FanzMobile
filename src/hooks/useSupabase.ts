// Supabase React Hooks for Data Fetching
import { useState, useEffect, useCallback } from 'react';
import { supabase, db, auth } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

// Generic fetch hook
export function useSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: Error | null }>,
  dependencies: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await queryFn();
      if (result.error) throw result.error;
      setData(result.data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [queryFn]);

  useEffect(() => {
    refetch();
  }, dependencies);

  return { data, loading, error, refetch };
}

// Auth hook
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    auth.getSession().then(({ session }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await auth.signIn(email, password);
    return { data, error };
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, unknown>) => {
    const { data, error } = await auth.signUp(email, password, metadata);
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await auth.signOut();
    return { error };
  };

  return { user, loading, signIn, signUp, signOut };
}

// Platforms hook
export function usePlatforms() {
  return useSupabaseQuery(
    () => db.platforms.getAll(),
    []
  );
}

// User profile hook
export function useUserProfile(userId: string | undefined) {
  return useSupabaseQuery(
    () => userId ? db.users.getById(userId) : Promise.resolve({ data: null, error: null }),
    [userId]
  );
}

// Creator profiles hook
export function useCreatorProfiles(userId: string | undefined) {
  return useSupabaseQuery(
    () => userId ? db.creators.getByUserId(userId) : Promise.resolve({ data: null, error: null }),
    [userId]
  );
}

// Content hook
export function useCreatorContent(creatorId: string | undefined, limit = 20) {
  return useSupabaseQuery(
    () => creatorId ? db.content.getByCreator(creatorId, limit) : Promise.resolve({ data: null, error: null }),
    [creatorId, limit]
  );
}

// Scheduled posts hook
export function useScheduledPosts(creatorId: string | undefined) {
  return useSupabaseQuery(
    () => creatorId ? db.scheduledPosts.getByCreator(creatorId) : Promise.resolve({ data: null, error: null }),
    [creatorId]
  );
}

// Analytics hook
export function useCreatorAnalytics(creatorId: string | undefined, days = 30) {
  return useSupabaseQuery(
    () => creatorId ? db.analytics.getCreatorStats(creatorId, days) : Promise.resolve({ data: null, error: null }),
    [creatorId, days]
  );
}

// Earnings hook
export function useCreatorEarnings(creatorId: string | undefined, days = 30) {
  return useSupabaseQuery(
    () => creatorId ? db.analytics.getEarnings(creatorId, days) : Promise.resolve({ data: null, error: null }),
    [creatorId, days]
  );
}

// DMCA stats hook
export function useDMCAStats(creatorId: string | undefined) {
  return useSupabaseQuery(
    () => creatorId ? db.dmca.getStats(creatorId) : Promise.resolve({ data: null, error: null }),
    [creatorId]
  );
}

// DMCA records hook
export function useDMCARecords(creatorId: string | undefined) {
  return useSupabaseQuery(
    () => creatorId ? db.dmca.getByCreator(creatorId) : Promise.resolve({ data: null, error: null }),
    [creatorId]
  );
}

// Admin system stats hook
export function useAdminStats() {
  const [stats, setStats] = useState<{
    totalUsers: number;
    totalContent: number;
    totalRevenue: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await db.admin.getSystemStats();
        setStats(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return { stats, loading, error };
}

// Admin recent users hook
export function useAdminRecentUsers(limit = 10) {
  return useSupabaseQuery(
    () => db.admin.getRecentUsers(limit),
    [limit]
  );
}

// Platform metrics hook
export function usePlatformMetrics() {
  return useSupabaseQuery(
    () => db.analytics.getPlatformMetrics(),
    []
  );
}

// Dashboard stats hook - aggregates multiple queries
export function useDashboardStats(creatorId: string | undefined) {
  const [stats, setStats] = useState({
    todayEarnings: 0,
    newFollowers: 0,
    protectedContent: 0,
    dmcaTakedowns: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!creatorId) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const [earnings, analytics, dmca] = await Promise.all([
          db.analytics.getEarnings(creatorId, 1),
          db.analytics.getCreatorStats(creatorId, 1),
          db.dmca.getStats(creatorId)
        ]);

        const todayEarnings = earnings.data?.reduce((sum, e) => sum + e.amount, 0) || 0;
        const newFollowers = analytics.data?.[0]?.new_followers || 0;
        
        setStats({
          todayEarnings,
          newFollowers,
          protectedContent: 0, // Would need content count query
          dmcaTakedowns: dmca.data?.resolved || 0
        });
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [creatorId]);

  return { stats, loading };
}

// Real-time messages hook
export function useRealtimeMessages(conversationId: string | undefined) {
  const [messages, setMessages] = useState<unknown[]>([]);

  useEffect(() => {
    if (!conversationId) return;

    // Fetch initial messages
    db.messages.getMessages(conversationId).then(({ data }) => {
      if (data) setMessages(data);
    });

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        setMessages(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return messages;
}

// Mutations
export function useCreateContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createContent = async (content: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await db.content.create(content);
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createContent, loading, error };
}

export function useCreateScheduledPost() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createPost = async (post: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await db.scheduledPosts.create(post);
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createPost, loading, error };
}

export function useReportDMCA() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const reportDMCA = async (request: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await db.dmca.create(request);
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { reportDMCA, loading, error };
}

