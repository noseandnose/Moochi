import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { syncWidget, widgetSupported } from '@/services/widgetSync';

import { useGame } from './GameProvider';

/** Pushes a fresh snapshot to the home screen widget shortly after any change. */
export function WidgetSync() {
  const { state, ready } = useGame();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!ready || !widgetSupported || Platform.OS === 'web') return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      syncWidget(state).catch(() => undefined);
    }, 1200);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [state, ready]);
  return null;
}
