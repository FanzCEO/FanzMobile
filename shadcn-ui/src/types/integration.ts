export type IntegrationProvider =
  | 'google_calendar'
  | 'outlook'
  | 'twilio'
  | 'telnyx'
  | 'telegram'
  | 'rm_chat'
  | 'whatsapp'
  | 'slack'
  | 'discord'
  | 'smtp'
  | 'imap'
  | 'gmail'
  | 'webhook'
  | 'notion'
  | 'livekit'
  | 'github';

export interface Integration {
  id: string;
  user_id: string;
  provider: IntegrationProvider;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ConnectIntegrationRequest {
  provider: IntegrationProvider;
  access_token?: string;
  refresh_token?: string;
  metadata?: Record<string, unknown>;
}
