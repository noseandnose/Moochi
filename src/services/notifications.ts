import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL = 'daily-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}

export type ReminderId = 'evening' | 'water' | 'streak';

export interface PlannedReminder {
  id: ReminderId;
  /** Absolute local time to fire. Each reminder is a one-shot that the app re-plans on every change. */
  at: Date;
  title: string;
  body: string;
}

const IDENTIFIER: Record<ReminderId, string> = { evening: 'mochi-daily-reminder', water: 'mochi-water-nudge', streak: 'mochi-streak-warning' };

/**
 * Replaces every scheduled MOCHI notification with the given plan. The plan
 * is computed from the current game state so each notification says what
 * the pet actually needs when it fires; a stale one is cancelled by the next
 * sync rather than left to fire with old text.
 */
export async function syncReminders(plan: PlannedReminder[]): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL, {
        name: 'Daily reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 120],
      });
    }
    await Notifications.cancelAllScheduledNotificationsAsync().catch(() => undefined);
    for (const r of plan) {
      if (r.at.getTime() <= Date.now()) continue;
      await Notifications.scheduleNotificationAsync({
        identifier: IDENTIFIER[r.id],
        content: { title: r.title, body: r.body, sound: false },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.at, channelId: CHANNEL },
      });
    }
    return true;
  } catch {
    return false;
  }
}

export async function cancelReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Nothing scheduled.
  }
}
