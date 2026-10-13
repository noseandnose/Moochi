import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { getCompletedCount } from '@/game';
import { cancelDailyReminder, scheduleDailyReminder } from '@/services/notifications';

import { useGame } from './GameProvider';

/**
 * Keeps the daily reminder scheduled with a body that reflects today's
 * progress. Re-scheduled (debounced) after every state change so the text
 * is current when it fires; if the time has already passed today the text
 * is written for tomorrow.
 */
export function ReminderSync() {
  const { state, ready } = useGame();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { reminderEnabled, reminderHour, reminderMinute } = state.prefs;
  const completed = getCompletedCount(state);
  const petName = state.profile.petName;

  useEffect(() => {
    if (!ready || Platform.OS === 'web') return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!reminderEnabled) {
        cancelDailyReminder();
        return;
      }
      const nowDate = new Date();
      const firesToday = nowDate.getHours() * 60 + nowDate.getMinutes() < reminderHour * 60 + reminderMinute;
      const remaining = 3 - completed;
      const body = firesToday
        ? remaining === 0
          ? 'All three goals done. Anything for the bonus row?'
          : `${remaining} of 3 goals left today. ${petName} is waiting.`
        : `A new day for ${petName}. Three goals, one at a time.`;
      scheduleDailyReminder({ hour: reminderHour, minute: reminderMinute, title: 'MOCHI', body });
    }, 1500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [ready, reminderEnabled, reminderHour, reminderMinute, completed, petName]);

  return null;
}
