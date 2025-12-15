import { apiClient } from './client';
import type { Contact, CreateContactRequest, UpdateContactRequest } from '@/types/contact';

export const contactsApi = {
  getContacts: async (params?: {
    skip?: number;
    limit?: number;
    search?: string;
  }): Promise<Contact[]> => {
    const response = await apiClient.get<Contact[]>('/api/contacts', { params });
    return response.data;
  },

  createContact: async (data: CreateContactRequest): Promise<Contact> => {
    const response = await apiClient.post<Contact>('/api/contacts', data);
    return response.data;
  },

  updateContact: async (id: string, data: UpdateContactRequest): Promise<Contact> => {
    const response = await apiClient.put<Contact>(`/api/contacts/${id}`, data);
    return response.data;
  },

  deleteContact: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/contacts/${id}`);
  },

  getContactById: async (id: string): Promise<Contact> => {
    const response = await apiClient.get<Contact>(`/api/contacts/${id}`);
    return response.data;
  },
};