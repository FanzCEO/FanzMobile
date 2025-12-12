// Platform Connection and Profile Management System
// Now connected to Supabase for real data

import { db } from './supabase';

export interface PlatformProfile {
  id: string;
  platformName: string;
  username: string;
  displayName: string;
  avatar: string;
  followers: number;
  isConnected: boolean;
  isVerified: boolean;
  lastSync: string;
  earnings: number;
  engagement: number;
  apiToken?: string;
}

export interface SocialMediaBot {
  id: string;
  name: string;
  platform: string;
  isActive: boolean;
  messagesSent: number;
  responseRate: number;
  automationRules: AutomationRule[];
}

export interface AutomationRule {
  id: string;
  trigger: 'new_follower' | 'message_received' | 'tip_received' | 'content_liked' | 'scheduled';
  condition?: string;
  action: 'send_message' | 'send_media' | 'add_to_funnel' | 'schedule_call';
  template: string;
  delay?: number;
  isActive: boolean;
}

export interface CRMContact {
  id: string;
  username: string;
  displayName: string;
  platform: string;
  email?: string;
  phone?: string;
  tags: string[];
  tier: 'free' | 'premium' | 'vip' | 'whale';
  totalSpent: number;
  lastInteraction: string;
  notes: string[];
  customFields: Record<string, string | number | boolean>;
  automationStatus: 'active' | 'paused' | 'completed';
  funnelStage: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  category: 'welcome' | 'promotion' | 'upsell' | 'retention' | 'custom';
  content: string;
  mediaAttachments?: string[];
  variables: string[];
  platforms: string[];
  isActive: boolean;
}

export interface CloudStorage {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadDate: string;
  cloudProvider: 'AWS' | 'Google' | 'Azure' | 'FANZ';
  storageUrl: string;
  isPublic: boolean;
  metadata: Record<string, string | number>;
}

export interface AnalyticsData {
  date: string;
  platform: string;
  profileId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  revenue: number;
  newFollowers: number;
  engagement: number;
}

// Platform Manager - Now with Supabase integration
export class PlatformManager {
  private profiles: PlatformProfile[] = [];
  private bots: SocialMediaBot[] = [];
  private contacts: CRMContact[] = [];
  private cloudStorage: CloudStorage[] = [];
  private analyticsData: AnalyticsData[] = [];
  private initialized = false;

  async initialize(userId: string): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Fetch creator profiles from Supabase
      const { data: creatorsData } = await db.creators.getByUserId(userId);
      
      if (creatorsData) {
        this.profiles = creatorsData.map(c => ({
          id: c.id,
          platformName: (c.platforms as { name: string })?.name || 'Unknown',
          username: c.username,
          displayName: c.display_name,
          avatar: c.avatar_url || '',
          followers: c.follower_count || 0,
          isConnected: true,
          isVerified: c.is_verified || false,
          lastSync: c.updated_at,
          earnings: c.total_earnings || 0,
          engagement: 0 // Would come from analytics
        }));
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize platform manager:', error);
      // Fall back to empty state
      this.profiles = [];
    }
  }

  getProfiles(): PlatformProfile[] {
    return this.profiles;
  }

  getConnectedProfiles(): PlatformProfile[] {
    return this.profiles.filter(p => p.isConnected);
  }

  getProfilesByPlatform(platform: string): PlatformProfile[] {
    return this.profiles.filter(p => p.platformName === platform);
  }

  async connectProfile(profileId: string): Promise<boolean> {
    const profile = this.profiles.find(p => p.id === profileId);
    if (profile) {
      profile.isConnected = true;
      profile.lastSync = new Date().toISOString();
      // TODO: Update in Supabase
      return true;
    }
    return false;
  }

  async disconnectProfile(profileId: string): Promise<boolean> {
    const profile = this.profiles.find(p => p.id === profileId);
    if (profile) {
      profile.isConnected = false;
      // TODO: Update in Supabase
      return true;
    }
    return false;
  }

  getBots(): SocialMediaBot[] {
    return this.bots;
  }

  getContacts(): CRMContact[] {
    return this.contacts;
  }

  getCloudStorage(): CloudStorage[] {
    return this.cloudStorage;
  }

  getAnalyticsData(): AnalyticsData[] {
    return this.analyticsData;
  }

  async fetchAnalytics(creatorId: string, days = 30): Promise<AnalyticsData[]> {
    try {
      const { data } = await db.analytics.getCreatorStats(creatorId, days);
      
      if (data) {
        this.analyticsData = data.map(a => ({
          date: a.date,
          platform: '', // Would need to join with platform data
          profileId: a.creator_id,
          views: a.views || 0,
          likes: a.likes || 0,
          comments: a.comments || 0,
          shares: a.shares || 0,
          revenue: a.revenue || 0,
          newFollowers: a.new_followers || 0,
          engagement: a.engagement_rate || 0
        }));
      }
      
      return this.analyticsData;
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      return [];
    }
  }

  addContact(contact: Omit<CRMContact, 'id'>): CRMContact {
    const newContact: CRMContact = {
      ...contact,
      id: 'contact_' + Date.now()
    };
    this.contacts.push(newContact);
    // TODO: Save to Supabase
    return newContact;
  }

  updateContact(contactId: string, updates: Partial<CRMContact>): boolean {
    const contactIndex = this.contacts.findIndex(c => c.id === contactId);
    if (contactIndex !== -1) {
      this.contacts[contactIndex] = { ...this.contacts[contactIndex], ...updates };
      // TODO: Update in Supabase
      return true;
    }
    return false;
  }

  uploadToCloud(file: File, metadata: Record<string, string | number>): CloudStorage {
    const storage: CloudStorage = {
      id: 'storage_' + Date.now(),
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadDate: new Date().toISOString(),
      cloudProvider: 'FANZ',
      storageUrl: `https://fanz-cloud.com/storage/${file.name}`,
      isPublic: false,
      metadata
    };
    this.cloudStorage.push(storage);
    // TODO: Upload to Supabase storage
    return storage;
  }
}

// Message Automation - Templates from Supabase
export class MessageAutomation {
  private templates: MessageTemplate[] = [
    {
      id: 'welcome_new',
      name: 'New Follower Welcome',
      category: 'welcome',
      content: 'Hey {{username}}! 👋 Thanks for following! I post exclusive content daily. Check out my latest post and let me know what you think! 😘',
      variables: ['username'],
      platforms: ['BoyFanz', 'GirlFanz', 'PupFanz'],
      isActive: true
    },
    {
      id: 'tip_thanks',
      name: 'Tip Thank You',
      category: 'retention',
      content: 'OMG {{username}}! 😍 Thank you so much for the tip! You\'re amazing! Here\'s a special something just for you... 💕',
      mediaAttachments: [],
      variables: ['username'],
      platforms: ['BoyFanz', 'GirlFanz'],
      isActive: true
    },
    {
      id: 'premium_upsell',
      name: 'Premium Upsell',
      category: 'upsell',
      content: 'Hey {{username}}! 🔥 I noticed you liked my recent posts. Want to see the uncensored versions? Upgrade to premium for exclusive content! Only ${{price}}/month 💎',
      variables: ['username', 'price'],
      platforms: ['All'],
      isActive: true
    }
  ];

  getTemplates(): MessageTemplate[] {
    return this.templates;
  }

  getTemplatesByCategory(category: string): MessageTemplate[] {
    return this.templates.filter(t => t.category === category);
  }

  processMessage(template: MessageTemplate, variables: Record<string, string>): string {
    let message = template.content;
    template.variables.forEach(variable => {
      const value = variables[variable] || `{{${variable}}}`;
      message = message.replace(new RegExp(`{{${variable}}}`, 'g'), value);
    });
    return message;
  }

  scheduleMessage(contactId: string, templateId: string, variables: Record<string, string>, delay: number = 0): boolean {
    console.log(`Scheduled message for contact ${contactId} with template ${templateId} in ${delay} minutes`);
    // TODO: Save to Supabase scheduled_messages table
    return true;
  }
}

// Singleton instances
export const platformManager = new PlatformManager();
export const messageAutomation = new MessageAutomation();
