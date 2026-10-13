import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { dateKey } from '@/game';

/** Current local date key, refreshed on foreground and every minute. */
export function useTodayKey(): string {
  const [key, setKey] = useState(() => dateKey(Date.now()));
  useEffect(() => {
    const tick = () => setKey(dateKey(Date.now()));
    const interval = setInterval(tick, 60_000);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && tick());
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, []);
  return key;
}

export function formatLongDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d, 12);
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

/** Wall-clock milliseconds, refreshed once a minute and on foreground (safe to use in render). */
export function useNowMinute(): number {
  const [ms, setMs] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setMs(Date.now());
    const interval = setInterval(tick, 60_000);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && tick());
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, []);
  return ms;
}

/** Current timestamp for actions (kept out of render paths). */
export function now(): number {
  return Date.now();
}
