export interface Contact {
  id: string;
  user_id: string;
  name: string | null;
  phone_number: string | null;
  email: string | null;
  organization: string | null;
  tags: string[];
  importance_score: number;
  last_interaction_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateContactRequest {
  name?: string;
  phone_number?: string;
  email?: string;
  organization?: string;
  tags?: string[];
}

export interface UpdateContactRequest extends CreateContactRequest {
  importance_score?: number;
}