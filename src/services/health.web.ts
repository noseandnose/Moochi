export type HealthStatus = 'available' | 'unavailable' | 'needsInstall';

export interface HealthActivity {
  steps: number;
  workoutMinutes: number;
}

export const healthProviderName = 'Health';

export async function getHealthStatus(): Promise<HealthStatus> {
  return 'unavailable';
}

export async function requestHealthAccess(): Promise<boolean> {
  return false;
}

export async function readTodayActivity(_now?: number): Promise<HealthActivity | null> {
  return null;
}
