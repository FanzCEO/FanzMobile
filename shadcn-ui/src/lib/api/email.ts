import { apiClient } from './client';

export interface EmailConfig {
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_use_tls: boolean;
  imap_host?: string;
  imap_port?: number;
  imap_username?: string;
  imap_password?: string;
  from_email: string;
  from_name?: string;
}

export interface EmailConfigStatus {
  configured: boolean;
  smtp_host?: string;
  smtp_port?: number;
  smtp_use_tls?: boolean;
  imap_host?: string;
  imap_port?: number;
  from_email?: string;
  from_name?: string;
}

export interface SendEmailRequest {
  to: string[];
  subject: string;
  body: string;
  html?: string;
  cc?: string[];
  bcc?: string[];
  reply_to?: string;
}

export interface EmailMessage {
  id: string;
  from_email: string;
  to_email: string;
  subject: string;
  body: string;
  html?: string;
  direction: 'inbound' | 'outbound';
  status: string;
  sent_at?: string;
  created_at: string;
}

export const emailApi = {
  getConfig: async (): Promise<EmailConfigStatus> => {
    const { data } = await apiClient.get<EmailConfigStatus>('/api/email/config');
    return data;
  },

  saveConfig: async (config: EmailConfig): Promise<void> => {
    await apiClient.post('/api/email/config', config);
  },

  deleteConfig: async (): Promise<void> => {
    await apiClient.delete('/api/email/config');
  },

  sendEmail: async (request: SendEmailRequest): Promise<{ status: string; id: string }> => {
    const { data } = await apiClient.post<{ status: string; id: string }>('/api/email/send', request);
    return data;
  },

  getMessages: async (params?: { limit?: number; skip?: number; direction?: string }): Promise<EmailMessage[]> => {
    const { data } = await apiClient.get<EmailMessage[]>('/api/email/messages', { params });
    return data;
  },

  testSmtp: async (): Promise<{ status: string; message: string }> => {
    const { data } = await apiClient.post<{ status: string; message: string }>('/api/email/test');
    return data;
  },
};
