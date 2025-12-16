import { useEffect, useState } from 'react';

type WSStatus = 'disabled' | 'connecting' | 'connected' | 'closed' | 'error';

interface RealtimeOptions {
  url?: string;
  onMessage?: (data: any) => void;
}

/**
 * Lightweight WebSocket helper with graceful disable when no URL is set.
 */
export function useRealtime({ url, onMessage }: RealtimeOptions) {
  const [status, setStatus] = useState<WSStatus>(() => (!url ? 'disabled' : 'connecting'));

  useEffect(() => {
    if (!url) {
      setStatus('disabled');
      return;
    }

    let ws: WebSocket | null = null;
    let cancelled = false;

    try {
      ws = new WebSocket(url);
    } catch (e) {
      setStatus('error');
      return;
    }

    ws.onopen = () => !cancelled && setStatus('connected');
    ws.onclose = () => !cancelled && setStatus('closed');
    ws.onerror = () => !cancelled && setStatus('error');
    ws.onmessage = (event) => {
      if (cancelled) return;
      try {
        const parsed = JSON.parse(event.data);
        onMessage?.(parsed);
      } catch {
        onMessage?.(event.data);
      }
    };

    return () => {
      cancelled = true;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [url, onMessage]);

  return { status };
}
