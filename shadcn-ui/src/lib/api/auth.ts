import { apiClient } from './client';
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '@/types/auth';

const DELETE_ACCOUNT_URL = import.meta.env.VITE_DELETE_ACCOUNT_URL || '/api/user/data';

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    // Production API uses OAuth2-style form login with 'username' field
    const formData = new URLSearchParams();
    formData.append('username', data.email);
    formData.append('password', data.password);

    const response = await apiClient.post<AuthResponse>('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    // Try JSON signup endpoint (for updated backend)
    const response = await apiClient.post<AuthResponse>('/api/auth/signup/email', {
      email: data.email,
      password: data.password,
      full_name: data.full_name,
    });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },

  requestAccountDeletion: async () => {
    const response = await apiClient.delete(DELETE_ACCOUNT_URL);
    return response.data;
  },
};

export const mapAuthResponseToUser = (res: AuthResponse, fallbackEmail?: string): { user: User; token: string } => {
  const token = res.access_token;
  const id = res.user?.id || res.user_id || 'unknown-user';
  const email = res.user?.email || fallbackEmail || 'user@example.com';
  const full_name = res.user?.full_name || res.user?.email?.split('@')[0] || fallbackEmail?.split('@')[0] || null;
  const created_at = res.user?.created_at || new Date().toISOString();

  const user: User = {
    id,
    email,
    full_name,
    created_at,
    comped: res.user?.comped,
    active_subscription: res.user?.active_subscription,
    subscription_plan: res.user?.subscription_plan,
  };

  return { user, token };
};
