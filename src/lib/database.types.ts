// Auto-generated Supabase Database Types
// Generated from Fanz Unified Ecosystem schema

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
          handle: string | null
          display_name: string | null
          avatar_url: string | null
          phone: string | null
          role: 'user' | 'creator' | 'admin'
          verified_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          handle?: string | null
          display_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: 'user' | 'creator' | 'admin'
          verified_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          handle?: string | null
          display_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: 'user' | 'creator' | 'admin'
          verified_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      platforms: {
        Row: {
          id: string
          name: string
          domain: string
          status: 'active' | 'inactive' | 'maintenance'
          branding: Json
          features: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          domain: string
          status?: 'active' | 'inactive' | 'maintenance'
          branding?: Json
          features?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          domain?: string
          status?: 'active' | 'inactive' | 'maintenance'
          branding?: Json
          features?: Json
          created_at?: string
          updated_at?: string
        }
      }
      creators: {
        Row: {
          id: string
          user_id: string
          platform_id: string
          username: string
          display_name: string
          bio: string | null
          avatar_url: string | null
          cover_url: string | null
          is_verified: boolean
          subscription_price: number
          total_earnings: number
          follower_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          platform_id: string
          username: string
          display_name: string
          bio?: string | null
          avatar_url?: string | null
          cover_url?: string | null
          is_verified?: boolean
          subscription_price?: number
          total_earnings?: number
          follower_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          platform_id?: string
          username?: string
          display_name?: string
          bio?: string | null
          avatar_url?: string | null
          cover_url?: string | null
          is_verified?: boolean
          subscription_price?: number
          total_earnings?: number
          follower_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      creator_profiles: {
        Row: {
          id: string
          creator_id: string
          bio: string | null
          website: string | null
          social_links: Json
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          bio?: string | null
          website?: string | null
          social_links?: Json
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          bio?: string | null
          website?: string | null
          social_links?: Json
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      content_posts: {
        Row: {
          id: string
          creator_id: string
          title: string | null
          caption: string | null
          content_type: 'image' | 'video' | 'audio' | 'text' | 'bundle'
          is_premium: boolean
          price: number | null
          status: 'draft' | 'processing' | 'published' | 'archived' | 'failed'
          view_count: number
          like_count: number
          comment_count: number
          earnings: number
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          title?: string | null
          caption?: string | null
          content_type?: 'image' | 'video' | 'audio' | 'text' | 'bundle'
          is_premium?: boolean
          price?: number | null
          status?: 'draft' | 'processing' | 'published' | 'archived' | 'failed'
          view_count?: number
          like_count?: number
          comment_count?: number
          earnings?: number
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          title?: string | null
          caption?: string | null
          content_type?: 'image' | 'video' | 'audio' | 'text' | 'bundle'
          is_premium?: boolean
          price?: number | null
          status?: 'draft' | 'processing' | 'published' | 'archived' | 'failed'
          view_count?: number
          like_count?: number
          comment_count?: number
          earnings?: number
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      content_media: {
        Row: {
          id: string
          content_id: string
          file_url: string
          thumbnail_url: string | null
          file_type: string
          file_size: number
          duration: number | null
          width: number | null
          height: number | null
          processing_status: 'pending' | 'processing' | 'completed' | 'failed'
          forensic_signature_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          content_id: string
          file_url: string
          thumbnail_url?: string | null
          file_type: string
          file_size: number
          duration?: number | null
          width?: number | null
          height?: number | null
          processing_status?: 'pending' | 'processing' | 'completed' | 'failed'
          forensic_signature_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          content_id?: string
          file_url?: string
          thumbnail_url?: string | null
          file_type?: string
          file_size?: number
          duration?: number | null
          width?: number | null
          height?: number | null
          processing_status?: 'pending' | 'processing' | 'completed' | 'failed'
          forensic_signature_id?: string | null
          created_at?: string
        }
      }
      scheduled_posts: {
        Row: {
          id: string
          creator_id: string
          content_id: string | null
          caption: string
          platforms: string[]
          scheduled_at: string
          status: 'scheduled' | 'published' | 'failed' | 'cancelled'
          published_at: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          content_id?: string | null
          caption: string
          platforms: string[]
          scheduled_at: string
          status?: 'scheduled' | 'published' | 'failed' | 'cancelled'
          published_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          content_id?: string | null
          caption?: string
          platforms?: string[]
          scheduled_at?: string
          status?: 'scheduled' | 'published' | 'failed' | 'cancelled'
          published_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      creator_analytics: {
        Row: {
          id: string
          creator_id: string
          date: string
          views: number
          likes: number
          comments: number
          shares: number
          new_followers: number
          revenue: number
          engagement_rate: number
          created_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          date: string
          views?: number
          likes?: number
          comments?: number
          shares?: number
          new_followers?: number
          revenue?: number
          engagement_rate?: number
          created_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          date?: string
          views?: number
          likes?: number
          comments?: number
          shares?: number
          new_followers?: number
          revenue?: number
          engagement_rate?: number
          created_at?: string
        }
      }
      creator_earnings_records: {
        Row: {
          id: string
          creator_id: string
          amount: number
          type: 'subscription' | 'tip' | 'ppv' | 'message' | 'referral'
          source_id: string | null
          platform_id: string
          status: 'pending' | 'completed' | 'refunded'
          created_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          amount: number
          type: 'subscription' | 'tip' | 'ppv' | 'message' | 'referral'
          source_id?: string | null
          platform_id: string
          status?: 'pending' | 'completed' | 'refunded'
          created_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          amount?: number
          type?: 'subscription' | 'tip' | 'ppv' | 'message' | 'referral'
          source_id?: string | null
          platform_id?: string
          status?: 'pending' | 'completed' | 'refunded'
          created_at?: string
        }
      }
      dmca_requests: {
        Row: {
          id: string
          creator_id: string
          content_id: string | null
          infringing_url: string
          platform_name: string | null
          status: 'pending' | 'issued' | 'resolved' | 'failed'
          issued_at: string | null
          resolved_at: string | null
          response_time_hours: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          content_id?: string | null
          infringing_url: string
          platform_name?: string | null
          status?: 'pending' | 'issued' | 'resolved' | 'failed'
          issued_at?: string | null
          resolved_at?: string | null
          response_time_hours?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          content_id?: string | null
          infringing_url?: string
          platform_name?: string | null
          status?: 'pending' | 'issued' | 'resolved' | 'failed'
          issued_at?: string | null
          resolved_at?: string | null
          response_time_hours?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          participant_1: string
          participant_2: string
          last_message_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          participant_1: string
          participant_2: string
          last_message_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          participant_1?: string
          participant_2?: string
          last_message_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          media_urls: string[] | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          media_urls?: string[] | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          media_urls?: string[] | null
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
      platform_memberships: {
        Row: {
          id: string
          user_id: string
          platform_id: string
          role: 'member' | 'creator' | 'admin'
          joined_at: string
        }
        Insert: {
          id?: string
          user_id: string
          platform_id: string
          role?: 'member' | 'creator' | 'admin'
          joined_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          platform_id?: string
          role?: 'member' | 'creator' | 'admin'
          joined_at?: string
        }
      }
      platform_metrics: {
        Row: {
          id: string
          platform_id: string
          total_users: number
          active_users: number
          total_creators: number
          total_content: number
          total_revenue: number
          recorded_at: string
        }
        Insert: {
          id?: string
          platform_id: string
          total_users?: number
          active_users?: number
          total_creators?: number
          total_content?: number
          total_revenue?: number
          recorded_at?: string
        }
        Update: {
          id?: string
          platform_id?: string
          total_users?: number
          active_users?: number
          total_creators?: number
          total_content?: number
          total_revenue?: number
          recorded_at?: string
        }
      }
      platform_revenue: {
        Row: {
          id: string
          platform_id: string
          amount: number
          type: string
          created_at: string
        }
        Insert: {
          id?: string
          platform_id: string
          amount: number
          type: string
          created_at?: string
        }
        Update: {
          id?: string
          platform_id?: string
          amount?: number
          type?: string
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
      [_ in never]: never
    }
  }
}

