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

export const adminApi = {
  updateUserAccess: async (data: UpdateUserAccessRequest) => {
    const res = await apiClient.post('/api/admin/users/access', data);
    return res.data;
  },
  updateFeatures: async (data: UpdateFeaturesRequest) => {
    const res = await apiClient.post('/api/admin/features', data);
    return res.data;
  },
};
