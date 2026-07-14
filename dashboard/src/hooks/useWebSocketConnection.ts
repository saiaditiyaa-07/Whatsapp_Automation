/**
 * useWebSocketConnection
 *
 * Base WebSocket hook. Responsibilities:
 * - Open a native browser WebSocket connection.
 * - Track connection status: 'connecting' | 'connected' | 'reconnecting' | 'offline'.
 * - Exponential back-off reconnection (max 30s).
 * - Server heartbeat: respond to pong events, send ping every 25s.
 * - Expose lastEvent so consumers can react to incoming messages.
 * - Clean up socket and timers on unmount.
 *
 * NO polling. NO setInterval for data refreshing.
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type WsStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline';

export interface WsEvent {
  type: string;
  payload: unknown;
  ts: string;
}

interface UseWebSocketConnectionOptions {
  /** Called when any message arrives – before the hook's own state update. */
  onMessage?: (event: WsEvent) => void;
  /** If false the socket will not be opened. Useful for conditional connections. */
  enabled?: boolean;
}

interface UseWebSocketConnectionReturn {
  status: WsStatus;
  lastEvent: WsEvent | null;
  sendMessage: (data: string) => void;
}

const INITIAL_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;
const PING_INTERVAL_MS = 25_000;

export function useWebSocketConnection(
  url: string | null,
  options: UseWebSocketConnectionOptions = {}
): UseWebSocketConnectionReturn {
  const { onMessage, enabled = true } = options;

  const [status, setStatus] = useState<WsStatus>('connecting');
  const [lastEvent, setLastEvent] = useState<WsEvent | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef<number>(INITIAL_BACKOFF_MS);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const urlRef = useRef<string | null>(url);
  // Store onMessage in a ref so connect() doesn't need it as a dep (avoids infinite reconnect)
  const onMessageRef = useRef(onMessage);
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);

  // Keep urlRef in sync without triggering reconnect
  useEffect(() => { urlRef.current = url; }, [url]);

  const clearPing = () => {
    if (pingTimerRef.current) {
      clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
  };

  const startPing = useCallback((ws: WebSocket) => {
    clearPing();
    pingTimerRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send('ping');
      }
    }, PING_INTERVAL_MS);
  }, []);

  const connect = useCallback(() => {
    if (!isMountedRef.current || !urlRef.current || !enabled) return;

    // Close existing socket if any
    if (socketRef.current) {
      socketRef.current.onclose = null;
      socketRef.current.onerror = null;
      socketRef.current.close();
    }

    const ws = new WebSocket(urlRef.current);
    socketRef.current = ws;
    setStatus('connecting');

    ws.onopen = () => {
      if (!isMountedRef.current) return;
      backoffRef.current = INITIAL_BACKOFF_MS; // reset backoff on success
      setStatus('connected');
      startPing(ws);
    };

    ws.onmessage = (ev) => {
      if (!isMountedRef.current) return;
      try {
        const parsed: WsEvent = JSON.parse(ev.data as string);
        setLastEvent(parsed);
        onMessageRef.current?.(parsed);
      } catch {
        // ignore malformed frames
      }
    };

    ws.onclose = () => {
      if (!isMountedRef.current) return;
      clearPing();
      const delay = backoffRef.current;
      backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
      setStatus(delay === INITIAL_BACKOFF_MS ? 'reconnecting' : 'offline');
      reconnectTimerRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      // Let onclose handle reconnection; just log
    };
  }, [enabled, startPing]); // onMessage intentionally excluded – stored in ref

  useEffect(() => {
    if (!enabled || !url) {
      setStatus('offline');
      return;
    }
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      clearPing();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        socketRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, enabled]);

  const sendMessage = useCallback((data: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(data);
    }
  }, []);

  return { status, lastEvent, sendMessage };
}
