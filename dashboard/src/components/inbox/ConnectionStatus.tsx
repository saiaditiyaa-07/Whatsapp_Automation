'use client';

import React from 'react';
import { WsStatus } from '@/hooks/useWebSocketConnection';

interface ConnectionStatusProps {
  status: WsStatus;
}

const statusConfig: Record<WsStatus, { dot: string; label: string; ring: string }> = {
  connected: {
    dot: 'bg-emerald-400',
    label: 'Connected',
    ring: 'bg-emerald-400/10 text-emerald-400 border-emerald-500/20',
  },
  connecting: {
    dot: 'bg-amber-400 animate-pulse',
    label: 'Connecting…',
    ring: 'bg-amber-400/10 text-amber-400 border-amber-500/20',
  },
  reconnecting: {
    dot: 'bg-amber-400 animate-pulse',
    label: 'Reconnecting…',
    ring: 'bg-amber-400/10 text-amber-400 border-amber-500/20',
  },
  offline: {
    dot: 'bg-rose-500',
    label: 'Offline',
    ring: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  },
};

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const cfg = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold tracking-wide select-none ${cfg.ring}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
