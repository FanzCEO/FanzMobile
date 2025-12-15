import { apiClient } from './client';
import type { Event, CreateEventRequest } from '@/types/event';

export const eventsApi = {
  getEvents: async (params?: {
    skip?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<Event[]> => {
    const response = await apiClient.get<Event[]>('/api/events', { params });
    return response.data;
  },

  createEvent: async (data: CreateEventRequest): Promise<Event> => {
    const response = await apiClient.post<Event>('/api/events', data);
    return response.data;
  },

  updateEvent: async (id: string, data: Partial<CreateEventRequest>): Promise<Event> => {
    const response = await apiClient.put<Event>(`/api/events/${id}`, data);
    return response.data;
  },

  deleteEvent: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/events/${id}`);
  },

  getEventById: async (id: string): Promise<Event> => {
    const response = await apiClient.get<Event>(`/api/events/${id}`);
    return response.data;
  },
};