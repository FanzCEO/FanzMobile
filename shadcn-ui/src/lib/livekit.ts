/**
 * Client-side helper to request a LiveKit token from backend.
 * Expects backend endpoint to return { token: string }.
 * This does not generate tokens on the client.
 */
export const livekitApi = {
  getToken: async (room: string, identity: string): Promise<string> => {
    const res = await fetch('/api/livekit/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room, identity }),
    });
    if (!res.ok) {
      throw new Error('Failed to fetch LiveKit token');
    }
    const data = await res.json();
    if (!data?.token) {
      throw new Error('Token missing in response');
    }
    return data.token;
  },
};
