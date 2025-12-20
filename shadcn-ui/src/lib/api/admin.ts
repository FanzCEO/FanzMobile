import { apiClient } from './client';

export interface UpdateUserAccessRequest {
  email: string;
  comped?: boolean;
  active_subscription?: boolean;
  subscription_plan?: string | null;
}

export interface UpdateFeaturesRequest {
  ptt_enabled?: boolean;
  ai_enabled?: boolean;
  logging_enabled?: boolean;
}

export interface PaymentProviderConfig {
  provider: string;
  config: Record<string, string>;
  updated_at?: string;
  created_at?: string;
}

export interface ThemeSettings {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  font_family: string;
  border_radius: string;
  logo_url?: string;
}

export interface UserSummary {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  comped: boolean;
  active_subscription: boolean;
  subscription_plan?: string;
  created_at?: string;
  last_login?: string;
  is_active: boolean;
}

export interface UpdateUserRequest {
  role?: string;
  comped?: boolean;
  active_subscription?: boolean;
  subscription_plan?: string;
  is_active?: boolean;
}

export interface SystemStats {
  total_users: number;
  subscribers: number;
  comped_users: number;
  total_contacts: number;
  total_messages: number;
}

const adminHeaders = () => {
  const key = import.meta.env.VITE_ADMIN_API_KEY;
  return key ? { 'x-admin-key': key } : undefined;
};

export const adminApi = {
  updateUserAccess: async (data: UpdateUserAccessRequest) => {
    const res = await apiClient.post('/api/admin/users/access', data, {
      headers: adminHeaders(),
    });
    return res.data;
  },
  updateFeatures: async (data: UpdateFeaturesRequest) => {
    const res = await apiClient.post('/api/admin/features', data, {
      headers: adminHeaders(),
    });
    return res.data;
  },
  listPaymentProviders: async (): Promise<PaymentProviderConfig[]> => {
    const res = await apiClient.get('/api/admin/payment-providers', {
      headers: adminHeaders(),
    });
    return res.data;
  },
  savePaymentProvider: async (provider: string, config: Record<string, string>) => {
    const res = await apiClient.put(
      `/api/admin/payment-providers/${provider}`,
      { config },
      { headers: adminHeaders() }
    );
    return res.data;
  },

  // Theme settings
  getTheme: async (): Promise<ThemeSettings> => {
    const res = await apiClient.get('/api/admin/theme');
    return res.data;
  },
  updateTheme: async (settings: ThemeSettings) => {
    const res = await apiClient.put('/api/admin/theme', settings, {
      headers: adminHeaders(),
    });
    return res.data;
  },

  // User management
  listUsers: async (params?: { limit?: number; offset?: number; search?: string }): Promise<UserSummary[]> => {
    const res = await apiClient.get('/api/admin/users', {
      headers: adminHeaders(),
      params,
    });
    return res.data;
  },
  getUserCount: async (search?: string): Promise<{ total: number }> => {
    const res = await apiClient.get('/api/admin/users/count', {
      headers: adminHeaders(),
      params: search ? { search } : undefined,
    });
    return res.data;
  },
  getUser: async (userId: string): Promise<UserSummary> => {
    const res = await apiClient.get(`/api/admin/users/${userId}`, {
      headers: adminHeaders(),
    });
    return res.data;
  },
  updateUser: async (userId: string, data: UpdateUserRequest) => {
    const res = await apiClient.patch(`/api/admin/users/${userId}`, data, {
      headers: adminHeaders(),
    });
    return res.data;
  },
  deleteUser: async (userId: string) => {
    const res = await apiClient.delete(`/api/admin/users/${userId}`, {
      headers: adminHeaders(),
    });
    return res.data;
  },

  // System stats
  getStats: async (): Promise<SystemStats> => {
    const res = await apiClient.get('/api/admin/stats', {
      headers: adminHeaders(),
    });
    return res.data;
  },
};
