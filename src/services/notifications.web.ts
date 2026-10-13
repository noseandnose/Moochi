export interface ReminderInput {
  hour: number;
  minute: number;
  title: string;
  body: string;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  return false;
}

export async function scheduleDailyReminder(_input: ReminderInput): Promise<boolean> {
  return false;
}

export async function cancelDailyReminder(): Promise<void> {}
