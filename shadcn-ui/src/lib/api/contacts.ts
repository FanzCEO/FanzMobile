import { apiClient } from './client';
import type { Contact, CreateContactRequest, UpdateContactRequest } from '@/types/contact';

export const contactsApi = {
  getContacts: async (params?: { 
    skip?: number; 
    limit?: number;
    search?: string;
  }): Promise<Contact[]> => {
    const response = await apiClient.get<Contact[]>('/contacts', { params });
    return response.data;
  },

  createContact: async (data: CreateContactRequest): Promise<Contact> => {
    const response = await apiClient.post<Contact>('/contacts', data);
    return response.data;
  },

  updateContact: async (id: string, data: UpdateContactRequest): Promise<Contact> => {
    const response = await apiClient.put<Contact>(`/contacts/${id}`, data);
    return response.data;
  },

  deleteContact: async (id: string): Promise<void> => {
    await apiClient.delete(`/contacts/${id}`);
  },

  getContactById: async (id: string): Promise<Contact> => {
    const response = await apiClient.get<Contact>(`/contacts/${id}`);
    return response.data;
  },
};