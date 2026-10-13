import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { syncReminders } from '@/services/notifications';
import { planReminders } from '@/services/reminderPlan';

import { useGame } from './GameProvider';

/**
 * Keeps local notifications in step with the game: after every state change
 * (debounced) and on every return to the foreground the plan is recomputed
 * from the current state, so a notification only fires when the pet still
 * needs something at that moment.
 */
export function ReminderSync() {
  const { state, ready } = useGame();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(state);

  useEffect(() => {
    latest.current = state;
    if (!ready || Platform.OS === 'web') return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      syncReminders(planReminders(state, Date.now()));
    }, 1500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [ready, state]);

  useEffect(() => {
    if (!ready || Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') syncReminders(planReminders(latest.current, Date.now()));
    });
    return () => sub.remove();
  }, [ready]);

  return null;
}
