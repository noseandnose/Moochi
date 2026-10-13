/**
 * Core game types. Everything in src/game is pure TypeScript with no
 * React Native imports so rules can be tested in isolation.
 */

export type PetId = 'foxi' | 'lumi' | 'drako';
export type Gender = 'female' | 'male' | 'unspecified';
export type WaterUnit = 'ml' | 'oz';
export type GearId = 'none' | 'cap' | 'bow' | 'glasses' | 'scarf' | 'crown';
export type StageId = 'egg' | 'baby' | 'teen' | 'adult' | 'companion';
export type HabitPath = 'balanced' | 'hydration' | 'active' | 'nourished';
export type GoalId = 'water' | 'movement' | 'eating';
export type CheckInId = 'movement' | 'eating' | 'bonus';
export type RewardKey = GoalId | 'bonus' | 'allThree';

/** A single water log entry. Amounts are always stored in millilitres. */
export interface WaterEntry {
  ml: number;
  at: number;
}

/** What actually happened on a local calendar day (editable via undo). */
export interface DailyRecord {
  water: boolean;
  movement: boolean;
  eating: boolean;
  bonus: boolean;
}

/** Rewards claimed per local calendar day. Never cleared by undo. */
export type Ledger = Record<string, Partial<Record<RewardKey, true>>>;

export interface Profile {
  petId: PetId;
  petName: string;
  gender: Gender;
  waterUnit: WaterUnit;
  waterTargetMl: number;
  movementMinutes: number;
  eatingGoal: string;
}

export interface Prefs {
  reduceMotion: boolean;
  haptics: boolean;
  sound: boolean;
}

export interface Progress {
  xp: number;
  coins: number;
  ownedGear: GearId[];
  equippedGear: GearId;
  /** Days on which each goal earned its reward. Cannot be inflated by undo. */
  habitCounts: Record<GoalId, number>;
}

export interface TodayState {
  date: string;
  waterEntries: WaterEntry[];
  movementDone: boolean;
  eatingDone: boolean;
  bonusDone: boolean;
}

export interface GameState {
  schemaVersion: number;
  /** Local date key of onboarding completion, or null before onboarding. */
  createdOn: string | null;
  profile: Profile;
  prefs: Prefs;
  progress: Progress;
  today: TodayState;
  ledger: Ledger;
  history: Record<string, DailyRecord>;
}

export type GameEvent =
  | { type: 'reward'; source: RewardKey; xp: number; coins: number }
  | { type: 'goalCompleted'; goal: GoalId | 'bonus' }
  | { type: 'goalUndone'; goal: GoalId | 'bonus' }
  | { type: 'allGoalsCompleted' }
  | { type: 'stageChanged'; from: StageId; to: StageId }
  | { type: 'purchase'; gear: GearId; cost: number }
  | { type: 'equipped'; gear: GearId }
  | { type: 'waterAdded'; ml: number }
  | { type: 'waterUndone'; ml: number }
  | { type: 'dayRolled'; from: string; to: string }
  | { type: 'error'; code: ErrorCode; message: string };

export type ErrorCode =
  | 'invalidAmount'
  | 'amountTooLarge'
  | 'nothingToUndo'
  | 'insufficientCoins'
  | 'alreadyOwned'
  | 'notOwned'
  | 'invalidTarget'
  | 'invalidMinutes'
  | 'invalidName';

export interface OnboardingInput {
  petId: PetId;
  petName: string;
  gender: Gender;
  waterUnit: WaterUnit;
  waterTargetMl: number;
  movementMinutes: number;
  eatingGoal: string;
}

export type GameAction =
  | { type: 'sync'; now: number }
  | { type: 'completeOnboarding'; input: OnboardingInput; now: number }
  | { type: 'addWater'; ml: number; now: number }
  | { type: 'undoWater'; now: number }
  | { type: 'setCheckIn'; goal: CheckInId; done: boolean; now: number }
  | { type: 'selectPet'; petId: PetId }
  | { type: 'renamePet'; name: string }
  | { type: 'updateProfile'; patch: Partial<Omit<Profile, 'petId'>>; now: number }
  | { type: 'setWaterUnit'; unit: WaterUnit }
  | { type: 'updatePrefs'; patch: Partial<Prefs> }
  | { type: 'buyGear'; gear: GearId }
  | { type: 'equipGear'; gear: GearId }
  | { type: 'reset' };

export interface GameResult {
  state: GameState;
  events: GameEvent[];
}
