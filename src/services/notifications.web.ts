export type ReminderId = 'evening' | 'water' | 'streak';

export interface PlannedReminder {
  id: ReminderId;
  at: Date;
  title: string;
  body: string;
  url?: string;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  return false;
}

export async function syncReminders(_plan: PlannedReminder[]): Promise<boolean> {
  return false;
}

export async function cancelReminders(): Promise<void> {}

export function onReminderOpened(_open: (url: string) => void): () => void {
  return () => undefined;
}
