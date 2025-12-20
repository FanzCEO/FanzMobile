import { apiClient } from './client';

export interface CartItemData {
  id: string;
  user_id: string;
  product_type: string;
  product_id: string;
  quantity: number;
  price_cents: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface AddToCartRequest {
  product_type: string;
  product_id: string;
  quantity: number;
  price_cents: number;
  metadata?: Record<string, any>;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CheckoutRequest {
  payment_method: 'card' | 'crypto' | 'ccbill' | 'paypal';
  billing_info?: {
    full_name?: string;
    email: string;
    card_number?: string;
    expiry_date?: string;
    cvv?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
  };
  age_verified: boolean;
  terms_accepted: boolean;
}

export interface CheckoutResponse {
  order_id: string;
  status: 'pending' | 'completed' | 'failed';
  payment_url?: string;
  message?: string;
}

/**
 * Get all cart items for the authenticated user
 */
export const getCartItems = async (): Promise<CartItemData[]> => {
  const response = await apiClient.get('/api/cart');
  return response.data;
};

/**
 * Add an item to the cart
 */
export const addToCart = async (data: AddToCartRequest): Promise<CartItemData> => {
  const response = await apiClient.post('/api/cart/add', data);
  return response.data;
};

/**
 * Update cart item quantity
 */
export const updateCartItem = async (
  itemId: string,
  data: UpdateCartItemRequest
): Promise<CartItemData> => {
  const response = await apiClient.put(`/api/cart/${itemId}`, data);
  return response.data;
};

/**
 * Remove an item from the cart
 */
export const removeCartItem = async (itemId: string): Promise<void> => {
  await apiClient.delete(`/api/cart/${itemId}`);
};

/**
 * Process checkout
 */
export const processCheckout = async (
  data: CheckoutRequest
): Promise<CheckoutResponse> => {
  const response = await apiClient.post('/api/checkout', data);
  return response.data;
};

/**
 * Clear all items from cart
 */
export const clearCart = async (): Promise<void> => {
  await apiClient.delete('/api/cart');
};
