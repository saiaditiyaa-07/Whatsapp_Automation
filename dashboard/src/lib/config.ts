if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_API_URL) {
  console.warn('Missing NEXT_PUBLIC_API_URL');
  console.log('Missing NEXT_PUBLIC_API_URL');
}

const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

export const API_BASE = rawApiUrl;

export const WS_BASE = rawApiUrl
  .replace('https://', 'wss://')
  .replace('http://', 'ws://');
