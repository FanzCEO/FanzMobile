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
};
