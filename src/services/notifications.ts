import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL = 'daily-reminder';
const IDENTIFIER = 'mochi-daily-reminder';

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

export interface ReminderInput {
  hour: number;
  minute: number;
  title: string;
  body: string;
}

/** Replaces the single daily reminder with new content and time. */
export async function scheduleDailyReminder({ hour, minute, title, body }: ReminderInput): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL, {
        name: 'Daily reminder',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 120],
      });
    }
    await Notifications.cancelScheduledNotificationAsync(IDENTIFIER).catch(() => undefined);
    await Notifications.scheduleNotificationAsync({
      identifier: IDENTIFIER,
      content: { title, body, sound: false },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: CHANNEL },
    });
    return true;
  } catch {
    return false;
  }
}

export async function cancelDailyReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(IDENTIFIER);
  } catch {
    // Nothing scheduled.
  }
}
