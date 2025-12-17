export interface User {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  comped?: boolean;
  active_subscription?: boolean;
  subscription_plan?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type?: string;
  user?: User;
  // Backend fallback fields
  status?: string;
  user_id?: string;
  expires_in?: number;
  message?: string;
}
