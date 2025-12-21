import { apiClient } from './client';

export interface UserSettings {
  has_openai: boolean;
  has_anthropic: boolean;
  has_groq: boolean;
  has_twilio: boolean;
  has_telnyx: boolean;
  has_telegram: boolean;
  has_livekit: boolean;
  has_smtp: boolean;
  openai_key?: string;
  anthropic_key?: string;
  groq_key?: string;
  huggingface_token?: string;
  huggingface_endpoint?: string;
  twilio_account_sid?: string;
  twilio_auth_token?: string;
  twilio_phone_number?: string;
  telnyx_api_key?: string;
  telnyx_phone_number?: string;
  telegram_bot_token?: string;
  livekit_api_key?: string;
  livekit_api_secret?: string;
  livekit_url?: string;
  smtp_host?: string;
  smtp_port?: string;
  smtp_username?: string;
  smtp_password?: string;
  smtp_from_email?: string;
  smtp_from_name?: string;
}

export interface UpdateSettingsRequest {
  openai_key?: string;
  anthropic_key?: string;
  groq_key?: string;
  huggingface_token?: string;
  huggingface_endpoint?: string;
  twilio_account_sid?: string;
  twilio_auth_token?: string;
  twilio_phone_number?: string;
  telnyx_api_key?: string;
  telnyx_phone_number?: string;
  telnyx_messaging_profile_id?: string;
  telegram_bot_token?: string;
  livekit_api_key?: string;
  livekit_api_secret?: string;
  livekit_url?: string;
  smtp_host?: string;
  smtp_port?: string;
  smtp_username?: string;
  smtp_password?: string;
  smtp_from_email?: string;
  smtp_from_name?: string;
}

export const settingsApi = {
  getSettings: async (): Promise<UserSettings> => {
    const { data } = await apiClient.get<UserSettings>('/api/settings');
    return data;
  },

  updateSettings: async (settings: UpdateSettingsRequest): Promise<UserSettings> => {
    const { data } = await apiClient.put<UserSettings>('/api/settings', settings);
    return data;
  },

  saveApiKeys: async (keys: UpdateSettingsRequest): Promise<UserSettings> => {
    const { data } = await apiClient.post<UserSettings>('/api/settings/api-keys', keys);
    return data;
  },

  deleteApiKey: async (keyName: string): Promise<void> => {
    await apiClient.delete(`/api/settings/api-keys/${keyName}`);
  },
};
