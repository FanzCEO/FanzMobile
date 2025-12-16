import { apiClient } from './client';

export interface FeeConfig {
  percent: number;
  flat_cents: number;
}

export interface FeesResponse {
  fees: Record<string, FeeConfig>;
}

export interface CheckoutSessionResponse {
  checkout_url: string;
}

export interface Plan {
  id: string;
  name: string;
  price: string;
  amount_cents?: number;
  currency?: string;
  interval?: string;
}

export const billingApi = {
  getFees: async (): Promise<FeesResponse> => {
    const res = await apiClient.get<FeesResponse>('/api/billing/fees');
    return res.data;
  },

  updateFee: async (type: string, percent: number, flat_cents: number): Promise<void> => {
    await apiClient.put(`/api/billing/fees/${type}`, { percent, flat_cents });
  },

  createFee: async (type: string, percent: number, flat_cents: number): Promise<void> => {
    await apiClient.post('/api/billing/fees', { type, percent, flat_cents });
  },

  deleteFee: async (type: string): Promise<void> => {
    await apiClient.delete(`/api/billing/fees/${type}`);
  },

  getPlans: async (): Promise<Plan[]> => {
    const res = await apiClient.get<{ plans: Plan[] }>('/api/billing/plans');
    return res.data.plans || [];
  },

  createCheckoutSession: async (planId: string): Promise<CheckoutSessionResponse> => {
    const res = await apiClient.post<CheckoutSessionResponse>('/api/billing/checkout', {
      plan_id: planId,
    });
    return res.data;
  },
};
