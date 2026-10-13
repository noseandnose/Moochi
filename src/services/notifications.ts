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
  /** Screen to open when the notification is tapped. */
  url?: string;
}

const IDENTIFIER: Record<ReminderId, string> = { evening: 'youchi-daily-reminder', water: 'youchi-water-nudge', streak: 'youchi-streak-warning' };

let chain: Promise<void> = Promise.resolve();
let generation = 0;
let lastApplied = '';

/**
 * Replaces every scheduled YOUCHI notification with the given plan. The plan
 * is computed from the current game state so each notification says what
 * the pet actually needs when it fires; a stale one is cancelled by the next
 * sync rather than left to fire with old text.
 */
export function syncReminders(plan: PlannedReminder[]): Promise<boolean> {
  // Re-plans arrive from the debounce, the foreground listener and health syncs at once;
  // run them one after another and let a newer plan supersede an older one mid-flight.
  const key = JSON.stringify(plan.map((r) => [r.id, r.at.getTime(), r.body]));
  if (key === lastApplied) return Promise.resolve(true);
  const mine = ++generation;
  let ok = false;
  chain = chain
    .then(async () => {
      if (mine !== generation) return;
      ok = await applyPlan(plan);
      if (ok) lastApplied = key;
    })
    .catch(() => undefined);
  return chain.then(() => ok);
}

async function applyPlan(plan: PlannedReminder[]): Promise<boolean> {
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
        content: { title: r.title, body: r.body, sound: false, data: r.url ? { url: r.url } : undefined },
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
    lastApplied = '';
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Nothing scheduled.
  }
}

/** Calls `open` with the deep link of a tapped reminder, including the one that launched the app. */
export function onReminderOpened(open: (url: string) => void): () => void {
  const handle = (response: Notifications.NotificationResponse | null) => {
    const url = response?.notification.request.content.data?.url;
    if (typeof url === 'string') open(url);
  };
  Notifications.getLastNotificationResponseAsync()
    .then(handle)
    .catch(() => undefined);
  const sub = Notifications.addNotificationResponseReceivedListener(handle);
  return () => sub.remove();
}
