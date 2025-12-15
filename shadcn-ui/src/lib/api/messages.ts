import { apiClient } from './client';
import type { Message, CreateMessageRequest } from '@/types/message';

export const messagesApi = {
  getMessages: async (params?: {
    skip?: number;
    limit?: number;
    channel?: string;
  }): Promise<Message[]> => {
    const response = await apiClient.get<Message[]>('/api/messages', { params });
    return response.data;
  },

  createMessage: async (data: CreateMessageRequest): Promise<Message> => {
    const response = await apiClient.post<Message>('/api/messages/manual', data);
    return response.data;
  },

  getMessageById: async (id: string): Promise<Message> => {
    const response = await apiClient.get<Message>(`/api/messages/${id}`);
    return response.data;
  },
};