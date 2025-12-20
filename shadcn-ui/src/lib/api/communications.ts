import { apiClient } from './client';

export interface SMSRequest {
  to: string;
  body: string;
  thread_id?: string;
  provider?: 'twilio' | 'telnyx';
}

export interface CallRequest {
  to: string;
  thread_id?: string;
  provider?: 'twilio' | 'livekit';
  callback_url?: string;
}

export interface EmailRequest {
  to: string;
  subject: string;
  body: string;
  thread_id?: string;
  html?: string;
}

export interface CommHistoryItem {
  id: string;
  type: 'sms' | 'call' | 'email' | 'message';
  direction: 'inbound' | 'outbound';
  to?: string;
  from_?: string;
  body?: string;
  status: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface CommStatusResponse {
  sms: {
    configured: boolean;
    providers: string[];
  };
  voice: {
    configured: boolean;
    providers: string[];
  };
  email: {
    configured: boolean;
    providers: string[];
  };
}

export const communicationsApi = {
  sendSMS: async (request: SMSRequest) => {
    const response = await apiClient.post('/api/comms/sms', request);
    return response.data;
  },

  initiateCall: async (request: CallRequest) => {
    const response = await apiClient.post('/api/comms/call', request);
    return response.data;
  },

  sendEmail: async (request: EmailRequest) => {
    const response = await apiClient.post('/api/comms/email', request);
    return response.data;
  },

  getHistory: async (params?: { limit?: number; offset?: number; type?: string }): Promise<CommHistoryItem[]> => {
    const response = await apiClient.get<CommHistoryItem[]>('/api/comms/history', { params });
    return response.data;
  },

  getStatus: async (): Promise<CommStatusResponse> => {
    const response = await apiClient.get<CommStatusResponse>('/api/comms/status');
    return response.data;
  },
};
