export type EventStatus = 'confirmed' | 'tentative' | 'cancelled';

export interface Event {
  id: string;
  user_id: string;
  contact_id: string | null;
  location_id: string | null;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  location: string | null;
  status: EventStatus;
  source_message_id: string | null;
  external_calendar_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEventRequest {
  contact_id?: string;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  location?: string;
  status?: EventStatus;
}