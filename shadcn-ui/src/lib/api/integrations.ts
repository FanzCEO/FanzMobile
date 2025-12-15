import { apiClient } from './client';
import type { Integration, ConnectIntegrationRequest } from '@/types/integration';

export const integrationsApi = {
  getIntegrations: async (): Promise<Integration[]> => {
    const response = await apiClient.get<Integration[]>('/api/integrations');
    return response.data;
  },

  connectIntegration: async (data: ConnectIntegrationRequest): Promise<Integration> => {
    const response = await apiClient.post<Integration>('/api/integrations/connect', data);
    return response.data;
  },

  disconnectIntegration: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/integrations/${id}`);
  },
};