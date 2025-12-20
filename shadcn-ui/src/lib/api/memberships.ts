import { apiClient } from './client';

export interface MembershipFeature {
  name: string;
  description?: string;
}

export interface Membership {
  id: string;
  name: string;
  description?: string;
  price_cents: number;
  billing_period: 'week' | 'month' | 'year';
  features: string[] | MembershipFeature[];
  is_active: boolean;
  popular?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  membership_id: string;
  membership?: Membership;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  started_at: string;
  expires_at?: string;
  cancelled_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SubscribeRequest {
  membership_id: string;
  payment_method?: string;
}

export interface SubscribeResponse {
  subscription: UserSubscription;
  message?: string;
  checkout_url?: string;
}

export interface CancelSubscriptionResponse {
  message: string;
  subscription?: UserSubscription;
}

export const membershipsApi = {
  // Get all available membership plans
  getPlans: async (): Promise<Membership[]> => {
    const res = await apiClient.get<{ memberships: Membership[] }>('/api/memberships');
    return res.data.memberships || [];
  },

  // Get current user's subscription
  getCurrentSubscription: async (): Promise<UserSubscription | null> => {
    try {
      const res = await apiClient.get<{ subscription: UserSubscription | null }>('/api/memberships/current');
      return res.data.subscription;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Subscribe to a membership plan
  subscribe: async (membershipId: string, paymentMethod?: string): Promise<SubscribeResponse> => {
    const res = await apiClient.post<SubscribeResponse>('/api/memberships/subscribe', {
      membership_id: membershipId,
      payment_method: paymentMethod,
    });
    return res.data;
  },

  // Cancel current subscription
  cancel: async (): Promise<CancelSubscriptionResponse> => {
    const res = await apiClient.post<CancelSubscriptionResponse>('/api/memberships/cancel');
    return res.data;
  },

  // Upgrade/downgrade subscription
  changePlan: async (membershipId: string): Promise<SubscribeResponse> => {
    const res = await apiClient.post<SubscribeResponse>('/api/memberships/change', {
      membership_id: membershipId,
    });
    return res.data;
  },
};
