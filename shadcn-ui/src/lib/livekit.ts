import { apiClient } from './api/client';

interface TokenResponse {
  token: string;
  url: string;
}

interface LiveKitConfig {
  configured: boolean;
  url: string | null;
}

// Cache the config to avoid repeated API calls
let cachedConfig: LiveKitConfig | null = null;

/**
 * Client-side helper to request a LiveKit token from backend.
 * Expects backend endpoint to return { token: string, url: string }.
 * This does not generate tokens on the client.
 */
export const livekitApi = {
  getToken: async (room: string, identity: string): Promise<{ token: string; url: string }> => {
    const { data } = await apiClient.post<TokenResponse>('/api/livekit/token', {
      room,
      identity,
    });
    if (!data?.token) {
      throw new Error('Token missing in response');
    }
    return { token: data.token, url: data.url };
  },

  getConfig: async (): Promise<LiveKitConfig> => {
    if (cachedConfig) return cachedConfig;

    const { data } = await apiClient.get<LiveKitConfig>('/api/livekit/config');
    cachedConfig = data;
    return data;
  },

  isConfigured: async (): Promise<boolean> => {
    try {
      const config = await livekitApi.getConfig();
      return config.configured && !!config.url;
    } catch {
      return false;
    }
  },
};
