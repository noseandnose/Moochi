import { Platform } from 'react-native';

/**
 * Reads today's steps and workout minutes from Apple Health (iOS) or Health
 * Connect (Android). Both libraries need a development build; in Expo Go or
 * when the native module is missing every call resolves to "unavailable".
 */
export type HealthStatus = 'available' | 'unavailable' | 'needsInstall';

export interface HealthActivity {
  steps: number;
  workoutMinutes: number;
}

export const healthProviderName = Platform.OS === 'ios' ? 'Apple Health' : 'Health Connect';

function startOfDay(now: number): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

/* ---------------------------------------------------------------- iOS */

type AppleHealthKitModule = {
  isAvailable: (cb: (err: unknown, available: boolean) => void) => void;
  initHealthKit: (permissions: { permissions: { read: string[]; write: string[] } }, cb: (err: string | null) => void) => void;
  getStepCount: (options: { date: string; includeManuallyAdded?: boolean }, cb: (err: string | null, result: { value: number } | null) => void) => void;
  getAnchoredWorkouts: (
    options: { startDate: string; endDate: string },
    cb: (err: unknown, result: { data: { start: string; end: string; duration?: number }[] } | null) => void,
  ) => void;
  Constants: { Permissions: Record<string, string> };
};

function loadAppleHealth(): AppleHealthKitModule | null {
  if (Platform.OS !== 'ios') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-health') as AppleHealthKitModule;
    return mod && typeof mod.isAvailable === 'function' ? mod : null;
  } catch {
    return null;
  }
}

async function iosStatus(): Promise<HealthStatus> {
  const hk = loadAppleHealth();
  if (!hk) return 'unavailable';
  return new Promise((resolve) => hk.isAvailable((_e, ok) => resolve(ok ? 'available' : 'unavailable')));
}

async function iosRequest(): Promise<boolean> {
  const hk = loadAppleHealth();
  if (!hk) return false;
  const read = [hk.Constants.Permissions.Steps, hk.Constants.Permissions.StepCount, hk.Constants.Permissions.Workout].filter(Boolean);
  return new Promise((resolve) => hk.initHealthKit({ permissions: { read, write: [] } }, (err) => resolve(!err)));
}

async function iosRead(now: number): Promise<HealthActivity | null> {
  const hk = loadAppleHealth();
  if (!hk) return null;
  const start = startOfDay(now);
  const steps = await new Promise<number>((resolve) =>
    hk.getStepCount({ date: start.toISOString(), includeManuallyAdded: true }, (err, result) => resolve(err || !result ? 0 : Math.max(0, Math.round(result.value ?? 0)))),
  );
  const workoutMinutes = await new Promise<number>((resolve) =>
    hk.getAnchoredWorkouts({ startDate: start.toISOString(), endDate: new Date(now).toISOString() }, (err, result) => {
      if (err || !result?.data) return resolve(0);
      let minutes = 0;
      for (const w of result.data) {
        const ms = new Date(w.end).getTime() - new Date(w.start).getTime();
        if (Number.isFinite(ms) && ms > 0) minutes += ms / 60000;
        else if (typeof w.duration === 'number') minutes += w.duration / 60;
      }
      resolve(Math.round(minutes));
    }),
  );
  return { steps, workoutMinutes };
}

/* ------------------------------------------------------------ Android */

type HealthConnectModule = {
  getSdkStatus: () => Promise<number>;
  initialize: () => Promise<boolean>;
  requestPermission: (permissions: { accessType: 'read'; recordType: string }[]) => Promise<unknown[]>;
  aggregateRecord: (request: { recordType: 'Steps'; timeRangeFilter: { operator: 'between'; startTime: string; endTime: string } }) => Promise<{ COUNT_TOTAL: number }>;
  readRecords: (
    recordType: 'ExerciseSession',
    options: { timeRangeFilter: { operator: 'between'; startTime: string; endTime: string } },
  ) => Promise<{ records: { startTime: string; endTime: string }[] }>;
  SdkAvailabilityStatus: { SDK_AVAILABLE: number; SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED: number };
};

function loadHealthConnect(): HealthConnectModule | null {
  if (Platform.OS !== 'android') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-health-connect') as HealthConnectModule;
    return mod && typeof mod.initialize === 'function' ? mod : null;
  } catch {
    return null;
  }
}

async function androidStatus(): Promise<HealthStatus> {
  const hc = loadHealthConnect();
  if (!hc) return 'unavailable';
  try {
    const status = await hc.getSdkStatus();
    if (status === hc.SdkAvailabilityStatus.SDK_AVAILABLE) return 'available';
    if (status === hc.SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) return 'needsInstall';
    return 'unavailable';
  } catch {
    return 'unavailable';
  }
}

async function androidRequest(): Promise<boolean> {
  const hc = loadHealthConnect();
  if (!hc) return false;
  try {
    if (!(await hc.initialize())) return false;
    const granted = await hc.requestPermission([
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'ExerciseSession' },
    ]);
    return Array.isArray(granted) && granted.length > 0;
  } catch {
    return false;
  }
}

async function androidRead(now: number): Promise<HealthActivity | null> {
  const hc = loadHealthConnect();
  if (!hc) return null;
  try {
    if (!(await hc.initialize())) return null;
    const timeRangeFilter = { operator: 'between' as const, startTime: startOfDay(now).toISOString(), endTime: new Date(now).toISOString() };
    const stepsResult = await hc.aggregateRecord({ recordType: 'Steps', timeRangeFilter }).catch(() => ({ COUNT_TOTAL: 0 }));
    const sessions = await hc.readRecords('ExerciseSession', { timeRangeFilter }).catch(() => ({ records: [] }));
    let minutes = 0;
    for (const r of sessions.records) {
      const ms = new Date(r.endTime).getTime() - new Date(r.startTime).getTime();
      if (Number.isFinite(ms) && ms > 0) minutes += ms / 60000;
    }
    return { steps: Math.max(0, Math.round(stepsResult.COUNT_TOTAL ?? 0)), workoutMinutes: Math.round(minutes) };
  } catch {
    return null;
  }
}

/* --------------------------------------------------------------- API */

export async function getHealthStatus(): Promise<HealthStatus> {
  if (Platform.OS === 'ios') return iosStatus();
  if (Platform.OS === 'android') return androidStatus();
  return 'unavailable';
}

/** Shows the system permission flow. Resolves true when reading is allowed. */
export async function requestHealthAccess(): Promise<boolean> {
  if (Platform.OS === 'ios') return iosRequest();
  if (Platform.OS === 'android') return androidRequest();
  return false;
}

/** Today's activity so far, or null when nothing could be read. */
export async function readTodayActivity(now: number = Date.now()): Promise<HealthActivity | null> {
  if (Platform.OS === 'ios') return iosRead(now);
  if (Platform.OS === 'android') return androidRead(now);
  return null;
}
