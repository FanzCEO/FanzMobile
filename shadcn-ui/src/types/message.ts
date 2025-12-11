export type MessageDirection = 'inbound' | 'outbound';
export type MessageChannel = 'sms' | 'rm_chat' | 'email' | 'manual' | 'whatsapp' | 'telegram' | 'telnyx';

export interface AIResult {
  contact_name?: string;
  phone_number?: string;
  meeting_detected?: boolean;
  meeting_time?: string;
  meeting_location?: string;
  tasks?: string[];
  intent?: string;
  importance?: number;
}

export interface Message {
  id: string;
  user_id: string;
  contact_id: string | null;
  direction: MessageDirection;
  channel: MessageChannel;
  external_id: string | null;
  body: string;
  received_at: string;
  ai_processed: boolean;
  ai_result: AIResult | null;
  created_at: string;
}

export interface CreateMessageRequest {
  body: string;
  channel: MessageChannel;
  direction?: MessageDirection;
}