/**
 * Supabase Database TypeScript Types
 *
 * Generate these types using:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          is_verified: boolean
          is_creator: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          is_verified?: boolean
          is_creator?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          is_verified?: boolean
          is_creator?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          cover_image_url: string | null
          location: string | null
          website: string | null
          twitter_handle: string | null
          instagram_handle: string | null
          subscription_price: number | null
          followers_count: number
          following_count: number
          posts_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          cover_image_url?: string | null
          location?: string | null
          website?: string | null
          twitter_handle?: string | null
          instagram_handle?: string | null
          subscription_price?: number | null
          followers_count?: number
          following_count?: number
          posts_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          cover_image_url?: string | null
          location?: string | null
          website?: string | null
          twitter_handle?: string | null
          instagram_handle?: string | null
          subscription_price?: number | null
          followers_count?: number
          following_count?: number
          posts_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          content: string | null
          media_url: string | null
          media_type: string | null
          thumbnail_url: string | null
          is_locked: boolean
          price: number | null
          likes_count: number
          comments_count: number
          views_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content?: string | null
          media_url?: string | null
          media_type?: string | null
          thumbnail_url?: string | null
          is_locked?: boolean
          price?: number | null
          likes_count?: number
          comments_count?: number
          views_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string | null
          media_url?: string | null
          media_type?: string | null
          thumbnail_url?: string | null
          is_locked?: boolean
          price?: number | null
          likes_count?: number
          comments_count?: number
          views_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          subscriber_id: string
          creator_id: string
          status: 'active' | 'cancelled' | 'expired'
          started_at: string
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          subscriber_id: string
          creator_id: string
          status?: 'active' | 'cancelled' | 'expired'
          started_at?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          subscriber_id?: string
          creator_id?: string
          status?: 'active' | 'cancelled' | 'expired'
          started_at?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          content: string
          media_url: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id: string
          content: string
          media_url?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          recipient_id?: string
          content?: string
          media_url?: string | null
          is_read?: boolean
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          data: Json | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          data?: Json | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          data?: Json | null
          is_read?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'user' | 'creator' | 'admin'
      subscription_status: 'active' | 'cancelled' | 'expired'
      content_status: 'draft' | 'published' | 'archived'
    }
  }
}
