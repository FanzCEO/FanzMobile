import { apiClient } from './client';

export interface PhoneLookupResult {
  phone_number: string;
  formatted?: string;
  country_code?: string;
  carrier?: string;
  line_type?: string;
  is_valid: boolean;
  spam_score: number;
  spam_type?: string;
  caller_name?: string;
  caller_type?: string;
  is_verified: boolean;
  verification_source?: string;
  risk_level: 'low' | 'medium' | 'high' | 'blocked';
  tags: string[];
  notes?: string;
  lookup_time: string;
}

export interface SpamCheckResult {
  phone_number: string;
  spam_score: number;
  spam_type?: string;
  is_blocked: boolean;
  risk_level: string;
  recommendation: 'allow' | 'block';
}

export interface ScreeningResult {
  action: 'allow' | 'warn' | 'block';
  reason: string;
  phone_number: string;
  spam_type?: string;
  contact_name?: string;
  suggestion?: string;
}

export interface BlockedNumber {
  phone_number: string;
  reason?: string;
  blocked_at: string;
}

export const verificationApi = {
  lookupPhone: async (phoneNumber: string, options?: {
    checkSpam?: boolean;
    checkCarrier?: boolean;
    checkCallerId?: boolean;
  }): Promise<PhoneLookupResult> => {
    const response = await apiClient.post<PhoneLookupResult>('/api/verification/lookup', {
      phone_number: phoneNumber,
      check_spam: options?.checkSpam ?? true,
      check_carrier: options?.checkCarrier ?? true,
      check_caller_id: options?.checkCallerId ?? true,
    });
    return response.data;
  },

  quickSpamCheck: async (phoneNumber: string): Promise<SpamCheckResult> => {
    const response = await apiClient.get<SpamCheckResult>(
      `/api/verification/spam-check/${encodeURIComponent(phoneNumber)}`
    );
    return response.data;
  },

  screenIncoming: async (phoneNumber: string, messagePreview?: string): Promise<ScreeningResult> => {
    const params = new URLSearchParams({ phone_number: phoneNumber });
    if (messagePreview) {
      params.append('message_preview', messagePreview);
    }
    const response = await apiClient.post<ScreeningResult>(
      `/api/verification/screen?${params.toString()}`
    );
    return response.data;
  },

  reportSpam: async (phoneNumber: string, spamType: string, notes?: string): Promise<void> => {
    await apiClient.post('/api/verification/report-spam', {
      phone_number: phoneNumber,
      spam_type: spamType,
      notes,
    });
  },

  blockNumber: async (phoneNumber: string, reason?: string): Promise<void> => {
    await apiClient.post('/api/verification/block', {
      phone_number: phoneNumber,
      reason,
    });
  },

  unblockNumber: async (phoneNumber: string): Promise<void> => {
    await apiClient.delete(`/api/verification/block/${encodeURIComponent(phoneNumber)}`);
  },

  getBlockedNumbers: async (): Promise<BlockedNumber[]> => {
    const response = await apiClient.get<BlockedNumber[]>('/api/verification/blocked');
    return response.data;
  },
};
