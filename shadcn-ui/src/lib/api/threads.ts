import { apiClient } from './client';
import type { Thread, ThreadEvent, ChannelType } from '@/types/thread';

export const threadsApi = {
  list: async (params?: { limit?: number }): Promise<Thread[]> => {
    const response = await apiClient.get<Thread[]>('/api/threads', { params });
    return response.data;
  },
  getEvents: async (threadId: string): Promise<ThreadEvent[]> => {
    const response = await apiClient.get<ThreadEvent[]>(`/api/threads/${threadId}/events`);
    return response.data;
  },
  sendMessage: async (threadId: string, body: string, channel?: ChannelType): Promise<ThreadEvent> => {
    const response = await apiClient.post<ThreadEvent>(`/api/threads/${threadId}/messages`, {
      body,
      channel,
    });
    return response.data;
  },
};
