export type ChannelType =
  | 'ptt'
  | 'voice'
  | 'sms'
  | 'whatsapp'
  | 'telegram'
  | 'email'
  | 'in_app'
  | 'webhook';

export type ThreadEventType =
  | 'message'
  | 'voice'
  | 'call'
  | 'voicemail'
  | 'transcript'
  | 'alert'
  | 'status';

export type ThreadEventDirection = 'inbound' | 'outbound' | 'system';

export interface ThreadEvent {
  id: string;
  thread_id?: string;
  type: ThreadEventType;
  direction: ThreadEventDirection;
  body: string;
  channel: ChannelType | string;
  at: string;
  meta?: string;
}

export interface Thread {
  id: string;
  title: string;
  channel: ChannelType | string;
  last: string;
  unread?: boolean;
  events?: ThreadEvent[];
}
