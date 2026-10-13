import { DEFAULTS, GEAR_BY_ID, PET_BY_ID, SCHEMA_VERSION } from './constants';
import { isDateKey } from './date';
import type {
  DailyActivity,
  DailyRecord,
  GameState,
  GearId,
  Gender,
  Ledger,
  PetId,
  Prefs,
  Profile,
  Progress,
  RewardKey,
  SelfieRecord,
  TodayState,
  WaterEntry,
  WaterUnit,
} from './types';

export function createInitialState(): GameState {
  return {
    schemaVersion: SCHEMA_VERSION,
    createdOn: null,
    profile: {
      petId: 'tofu',
      petName: DEFAULTS.petName,
      gender: 'unspecified',
      waterUnit: 'ml',
      waterTargetMl: DEFAULTS.waterTargetUnspecifiedMl,
      movementMinutes: DEFAULTS.movementMinutes,
      eatingGoal: DEFAULTS.eatingGoal,
      customGoal: DEFAULTS.customGoal,
      stepTarget: DEFAULTS.stepTarget,
      healthEnabled: false,
    },
    prefs: { reduceMotion: false, haptics: true, sound: false, reminderEnabled: false, reminderHour: 19, reminderMinute: 30, coachMarkSeen: false, reviewRequested: false },
    progress: {
      xp: 0,
      coins: 0,
      ownedGear: ['none'],
      equippedGear: 'none',
      habitCounts: { water: 0, movement: 0, eating: 0 },
    },
    today: emptyDay(''),
    ledger: {},
    history: {},
    selfies: [],
  };
}

export function emptyDay(date: string): TodayState {
  return {
    date,
    waterEntries: [],
    movementDone: false,
    movementSource: null,
    eatingDone: false,
    bonusDone: false,
    selfieDone: false,
    customDone: false,
    activity: null,
  };
}

/* ------------------------------------------------------------------ */
/* Sanitising and migrating persisted data                             */
/* ------------------------------------------------------------------ */

type Migration = (raw: Record<string, unknown>) => Record<string, unknown>;

/**
 * Migrations keyed by the version they upgrade *from*. Version 1 is the
 * first mobile schema, so the map is empty today; new versions add an entry
 * and bump SCHEMA_VERSION.
 */
export const MIGRATIONS: Record<number, Migration> = {};

export type LoadOutcome =
  | { kind: 'fresh' }
  | { kind: 'ok'; state: GameState; migrated: boolean }
  | { kind: 'corrupt'; state: GameState; reason: string };

/**
 * Turns whatever was persisted into a valid GameState. Missing or malformed
 * fields fall back to defaults field-by-field so one bad value never wipes
 * valid progress. Returns `corrupt` only when the payload is unusable.
 */
export function loadState(raw: unknown): LoadOutcome {
  if (raw === null || raw === undefined) return { kind: 'fresh' };
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    return { kind: 'corrupt', state: createInitialState(), reason: 'not an object' };
  }
  let data = { ...(raw as Record<string, unknown>) };
  const startVersion = typeof data.schemaVersion === 'number' ? data.schemaVersion : 0;
  let migrated = false;
  for (let v = startVersion; v < SCHEMA_VERSION; v++) {
    const step = MIGRATIONS[v];
    if (step) {
      data = step(data);
      migrated = true;
    }
  }
  const state = sanitize(data);
  if (startVersion !== SCHEMA_VERSION) migrated = true;
  return { kind: 'ok', state, migrated };
}

export function sanitize(data: Record<string, unknown>): GameState {
  const base = createInitialState();
  const profile = sanitizeProfile(data.profile, base.profile);
  const prefs = sanitizePrefs(data.prefs, base.prefs);
  const progress = sanitizeProgress(data.progress, base.progress);
  const today = sanitizeToday(data.today);
  const ledger = sanitizeLedger(data.ledger);
  const history = sanitizeHistory(data.history);
  const selfies = sanitizeSelfies(data.selfies);
  const createdOn = isDateKey(data.createdOn) ? data.createdOn : null;
  return { schemaVersion: SCHEMA_VERSION, createdOn, profile, prefs, progress, today, ledger, history, selfies };
}

const PET_IDS: PetId[] = ['tofu', 'juno', 'pebble', 'ori', 'fern'];
const GENDERS: Gender[] = ['female', 'male', 'unspecified'];
const UNITS: WaterUnit[] = ['ml', 'oz'];
const REWARD_KEYS: RewardKey[] = ['water', 'movement', 'eating', 'bonus', 'selfie', 'custom', 'allThree'];

function obj(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function num(value: unknown, fallback: number, min = -Infinity, max = Infinity): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function str(value: unknown, fallback: string, max: number): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim().slice(0, max);
  return trimmed.length ? trimmed : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function oneOf<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && (options as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function sanitizeProfile(raw: unknown, base: Profile): Profile {
  const p = obj(raw);
  const petId = oneOf(p.petId, PET_IDS, base.petId);
  return {
    petId,
    petName: str(p.petName, PET_BY_ID[petId].name, DEFAULTS.maxPetNameLength),
    gender: oneOf(p.gender, GENDERS, base.gender),
    waterUnit: oneOf(p.waterUnit, UNITS, base.waterUnit),
    waterTargetMl: num(
      p.waterTargetMl,
      base.waterTargetMl,
      DEFAULTS.minWaterTargetMl,
      DEFAULTS.maxWaterTargetMl,
    ),
    movementMinutes: Math.round(
      num(p.movementMinutes, base.movementMinutes, DEFAULTS.minMovementMinutes, DEFAULTS.maxMovementMinutes),
    ),
    eatingGoal: str(p.eatingGoal, base.eatingGoal, DEFAULTS.maxEatingGoalLength),
    customGoal: typeof p.customGoal === 'string' ? p.customGoal.trim().slice(0, DEFAULTS.maxCustomGoalLength) : '',
    stepTarget: Math.round(num(p.stepTarget, base.stepTarget, DEFAULTS.minStepTarget, DEFAULTS.maxStepTarget)),
    healthEnabled: bool(p.healthEnabled, false),
  };
}

function sanitizePrefs(raw: unknown, base: Prefs): Prefs {
  const p = obj(raw);
  return {
    reduceMotion: bool(p.reduceMotion, base.reduceMotion),
    haptics: bool(p.haptics, base.haptics),
    sound: bool(p.sound, base.sound),
    reminderEnabled: bool(p.reminderEnabled, base.reminderEnabled),
    reminderHour: Math.round(num(p.reminderHour, base.reminderHour, 0, 23)),
    reminderMinute: Math.round(num(p.reminderMinute, base.reminderMinute, 0, 59)),
    coachMarkSeen: bool(p.coachMarkSeen, base.coachMarkSeen),
    reviewRequested: bool(p.reviewRequested, base.reviewRequested),
  };
}

function sanitizeProgress(raw: unknown, base: Progress): Progress {
  const p = obj(raw);
  const ownedRaw = Array.isArray(p.ownedGear) ? p.ownedGear : [];
  const owned = new Set<GearId>(['none']);
  for (const g of ownedRaw) if (typeof g === 'string' && g in GEAR_BY_ID) owned.add(g as GearId);
  const equippedCandidate = typeof p.equippedGear === 'string' ? (p.equippedGear as GearId) : 'none';
  const equippedGear = owned.has(equippedCandidate) ? equippedCandidate : 'none';
  const counts = obj(p.habitCounts);
  return {
    xp: Math.floor(num(p.xp, base.xp, 0, 1e9)),
    coins: Math.floor(num(p.coins, base.coins, 0, 1e9)),
    ownedGear: Array.from(owned),
    equippedGear,
    habitCounts: {
      water: Math.floor(num(counts.water, 0, 0, 1e6)),
      movement: Math.floor(num(counts.movement, 0, 0, 1e6)),
      eating: Math.floor(num(counts.eating, 0, 0, 1e6)),
    },
  };
}

function sanitizeToday(raw: unknown): TodayState {
  const t = obj(raw);
  const date = isDateKey(t.date) ? t.date : '';
  const entries: WaterEntry[] = [];
  if (Array.isArray(t.waterEntries)) {
    for (const e of t.waterEntries) {
      const entry = obj(e);
      const ml = num(entry.ml, NaN, 0.01, DEFAULTS.maxSingleEntryMl);
      if (Number.isFinite(ml)) entries.push({ ml, at: Math.floor(num(entry.at, 0, 0)) });
    }
  }
  const activityRaw = obj(t.activity);
  const activity: DailyActivity | null =
    t.activity && typeof t.activity === 'object'
      ? {
          steps: Math.floor(num(activityRaw.steps, 0, 0, 1e7)),
          workoutMinutes: Math.floor(num(activityRaw.workoutMinutes, 0, 0, 1e5)),
          syncedAt: Math.floor(num(activityRaw.syncedAt, 0, 0)),
        }
      : null;
  const movementDone = bool(t.movementDone, false);
  return {
    date,
    waterEntries: entries,
    movementDone,
    movementSource: movementDone ? oneOf(t.movementSource, ['manual', 'health'] as const, 'manual') : null,
    eatingDone: bool(t.eatingDone, false),
    bonusDone: bool(t.bonusDone, false),
    selfieDone: bool(t.selfieDone, false),
    customDone: bool(t.customDone, false),
    activity,
  };
}

function sanitizeSelfies(raw: unknown): SelfieRecord[] {
  if (!Array.isArray(raw)) return [];
  const out: SelfieRecord[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const r = obj(item);
    if (!isDateKey(r.date) || typeof r.file !== 'string' || !r.file.length || seen.has(r.date)) continue;
    seen.add(r.date);
    out.push({ date: r.date, file: r.file.slice(0, 120), at: Math.floor(num(r.at, 0, 0)) });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

function sanitizeLedger(raw: unknown): Ledger {
  const out: Ledger = {};
  for (const [date, value] of Object.entries(obj(raw))) {
    if (!isDateKey(date)) continue;
    const day = obj(value);
    const entry: Partial<Record<RewardKey, true>> = {};
    for (const key of REWARD_KEYS) if (day[key] === true) entry[key] = true;
    if (Object.keys(entry).length) out[date] = entry;
  }
  return out;
}

function sanitizeHistory(raw: unknown): Record<string, DailyRecord> {
  const out: Record<string, DailyRecord> = {};
  for (const [date, value] of Object.entries(obj(raw))) {
    if (!isDateKey(date)) continue;
    const day = obj(value);
    out[date] = {
      water: bool(day.water, false),
      movement: bool(day.movement, false),
      eating: bool(day.eating, false),
      bonus: bool(day.bonus, false),
      selfie: bool(day.selfie, false),
      custom: bool(day.custom, false),
    };
  }
  return out;
}
