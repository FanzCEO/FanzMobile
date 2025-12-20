import { apiClient } from './api/client';

interface TokenResponse {
  token: string;
  url: string;
}

interface LiveKitConfig {
  configured: boolean;
  url: string | null;
}

/**
 * Client-side helper to request a LiveKit token from backend.
 * Expects backend endpoint to return { token: string, url: string }.
 * This does not generate tokens on the client.
 */
export const livekitApi = {
  getToken: async (room: string, identity: string): Promise<string> => {
    const { data } = await apiClient.post<TokenResponse>('/api/livekit/token', {
      room,
      identity,
    });
    if (!data?.token) {
      throw new Error('Token missing in response');
    }
    return data.token;
  },

  getConfig: async (): Promise<LiveKitConfig> => {
    const { data } = await apiClient.get<LiveKitConfig>('/api/livekit/config');
    return data;
  },
};
