import { apiClient } from './client';

export interface CheckoutSessionResponse {
  checkout_url: string;
}

export interface FeeConfig {
  percent: number;
  flat_cents: number;
}

export interface FeesResponse {
  fees: Record<string, FeeConfig>;
  note: string;
}

export interface FeeCalculation {
  subtotal_cents: number;
  percent_fee_cents: number;
  flat_fee_cents: number;
  total_fee_cents: number;
  consumer_total_cents: number;
  creator_receives_cents: number;
}

export interface Plan {
  id: string;
  name: string;
  interval: string;
  amount_cents: number;
  currency: string;
}

export const billingApi = {
  getPlans: async (): Promise<Plan[]> => {
    const response = await apiClient.get<Plan[]>('/api/billing/plans');
    return response.data;
  },

  createCheckoutSession: async (planId: string): Promise<CheckoutSessionResponse> => {
    const res = await apiClient.post<CheckoutSessionResponse>('/api/billing/checkout', {
      plan_id: planId,
    });
    return res.data;
  },

  getFees: async (): Promise<FeesResponse> => {
    const response = await apiClient.get<FeesResponse>('/api/billing/fees');
    return response.data;
  },

  updateFee: async (
    transactionType: string,
    percent?: number,
    flatCents?: number
  ): Promise<FeeConfig & { transaction_type: string; message: string }> => {
    const response = await apiClient.put(`/api/billing/fees/${transactionType}`, {
      transaction_type: transactionType,
      percent,
      flat_cents: flatCents,
    });
    return response.data;
  },

  calculateFee: async (
    transactionType: string,
    amountCents: number
  ): Promise<FeeCalculation> => {
    const response = await apiClient.post<FeeCalculation>(
      `/api/billing/calculate?transaction_type=${transactionType}&amount_cents=${amountCents}`
    );
    return response.data;
  },

  createFee: async (
    transactionType: string,
    percent: number = 0,
    flatCents: number = 0
  ): Promise<FeeConfig & { transaction_type: string; message: string }> => {
    const response = await apiClient.post('/api/billing/fees', {
      transaction_type: transactionType,
      percent,
      flat_cents: flatCents,
    });
    return response.data;
  },

  deleteFee: async (transactionType: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/api/billing/fees/${transactionType}`);
    return response.data;
  },
};
