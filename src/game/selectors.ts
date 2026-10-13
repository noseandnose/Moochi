import {
  ACHIEVEMENTS,
  ASLEEP_AFTER_HOURS,
  CHALLENGES,
  LEVEL_XP,
  PATH_STAGE_MIN,
  STAGES,
  STAGE_INDEX,
} from './constants';
import { dateKey, dateKeyToNumber, recentDateKeys } from './date';
import type { BonusId, DailyRecord, GameState, GoalId, HabitPath, PetMood, SelfieRecord, StageId } from './types';
import { isWaterTargetReached, waterPercent } from './water';

export function isOnboarded(state: GameState): boolean {
  return state.createdOn !== null;
}

/* ---------------------------- progression ---------------------------- */

export function stageIndexForXp(xp: number): number {
  let index = 0;
  for (let i = 0; i < STAGES.length; i++) if (xp >= STAGES[i].xp) index = i;
  return index;
}

export function stageForXp(xp: number): StageId {
  return STAGES[stageIndexForXp(xp)].id;
}

export function getStage(state: GameState): StageId {
  return stageForXp(state.progress.xp);
}

export function getStageIndex(state: GameState): number {
  return stageIndexForXp(state.progress.xp);
}

export function getLevel(state: GameState): number {
  return Math.floor(state.progress.xp / LEVEL_XP) + 1;
}

export interface GrowthInfo {
  stage: StageId;
  stageName: string;
  nextStage: StageId | null;
  nextStageName: string | null;
  xpToNext: number;
  /** 0..1 progress between the current stage threshold and the next. */
  progress: number;
  level: number;
  isFinalStage: boolean;
}

export function getGrowth(state: GameState): GrowthInfo {
  const xp = state.progress.xp;
  const index = stageIndexForXp(xp);
  const current = STAGES[index];
  const next = STAGES[index + 1] ?? null;
  const level = getLevel(state);
  if (!next) {
    const into = xp % LEVEL_XP;
    return {
      stage: current.id,
      stageName: current.name,
      nextStage: null,
      nextStageName: null,
      xpToNext: LEVEL_XP - into,
      progress: into / LEVEL_XP,
      level,
      isFinalStage: true,
    };
  }
  return {
    stage: current.id,
    stageName: current.name,
    nextStage: next.id,
    nextStageName: next.name,
    xpToNext: next.xp - xp,
    progress: (xp - current.xp) / (next.xp - current.xp),
    level,
    isFinalStage: false,
  };
}

/* ----------------------------- habit path ---------------------------- */

export function pathForCounts(counts: Record<GoalId, number>): HabitPath {
  const values: [GoalId, number][] = [
    ['water', counts.water],
    ['movement', counts.movement],
    ['eating', counts.eating],
  ];
  const max = Math.max(...values.map(([, v]) => v));
  if (max <= 0) return 'balanced';
  const leaders = values.filter(([, v]) => v === max);
  if (leaders.length !== 1) return 'balanced';
  const leader = leaders[0][0];
  return leader === 'water' ? 'hydration' : leader === 'movement' ? 'active' : 'nourished';
}

/** The path the player's habits point to, regardless of stage. */
export function getHabitPath(state: GameState): HabitPath {
  return pathForCounts(state.progress.habitCounts);
}

/** The path that is actually drawn: balanced before the teen stage. */
export function getVisualPath(state: GameState): HabitPath {
  return getStageIndex(state) >= PATH_STAGE_MIN ? getHabitPath(state) : 'balanced';
}

/* ------------------------------- today ------------------------------- */

export function getWaterConsumedMl(state: GameState): number {
  return state.today.waterEntries.reduce((sum, e) => sum + e.ml, 0);
}

export function isWaterDone(state: GameState): boolean {
  return isWaterTargetReached(getWaterConsumedMl(state), state.profile.waterTargetMl);
}

export function getWaterPercent(state: GameState): number {
  return waterPercent(getWaterConsumedMl(state), state.profile.waterTargetMl);
}

export function isGoalDone(state: GameState, goal: GoalId | BonusId): boolean {
  switch (goal) {
    case 'water':
      return isWaterDone(state);
    case 'movement':
      return state.today.movementDone;
    case 'eating':
      return state.today.eatingDone;
    case 'bonus':
      return state.today.bonusDone;
    case 'selfie':
      return state.today.selfieDone;
    case 'custom':
      return state.today.customDone;
  }
}

/** Number of bonus tiles completed today (0..3). */
export function getBonusCount(state: GameState): number {
  return Number(state.today.selfieDone) + Number(state.today.bonusDone) + Number(state.today.customDone);
}

/** Whether today's health activity alone satisfies the movement goal. */
export function activitySatisfiesMovement(state: GameState): boolean {
  const a = state.today.activity;
  if (!a) return false;
  return a.workoutMinutes >= state.profile.movementMinutes || a.steps >= state.profile.stepTarget;
}

/**
 * The pet's current mood, in priority order: asleep after a long absence,
 * then the first unfinished daily goal (water, eating, movement), else content.
 * Eggs have no mood.
 */
export function getPetMood(state: GameState, now: number): PetMood {
  if (state.lastActiveAt > 0 && now - state.lastActiveAt >= ASLEEP_AFTER_HOURS * 3600 * 1000) return 'asleep';
  if (!isWaterDone(state)) return 'thirsty';
  if (!state.today.eatingDone) return 'hungry';
  if (!state.today.movementDone) return 'lazy';
  return 'content';
}

/** Short line that says what the mood is asking for. */
export function moodLine(mood: PetMood, petName: string): string {
  switch (mood) {
    case 'asleep':
      return `${petName} dozed off. Open the app to wake up.`;
    case 'thirsty':
      return `${petName} is thirsty. Log some water.`;
    case 'hungry':
      return `${petName} is hungry. Check in on eating well.`;
    case 'lazy':
      return `${petName} feels lazy. Log some movement.`;
    case 'content':
      return `${petName} is happy. All three goals done.`;
  }
}

export function getTodaySelfie(state: GameState): SelfieRecord | undefined {
  return state.selfies.find((s) => s.date === state.today.date);
}

export function getCompletedCount(state: GameState): number {
  return (
    Number(isWaterDone(state)) + Number(state.today.movementDone) + Number(state.today.eatingDone)
  );
}

export function getDailyRecord(state: GameState): DailyRecord {
  return {
    water: isWaterDone(state),
    movement: state.today.movementDone,
    eating: state.today.eatingDone,
    bonus: state.today.bonusDone,
    selfie: state.today.selfieDone,
    custom: state.today.customDone,
  };
}

export function getDailyChallenge(date: string): string {
  return CHALLENGES[dateKeyToNumber(date) % CHALLENGES.length];
}

/* ------------------------------ journey ------------------------------ */

/** Days on which at least one of the three goals earned its reward. */
export function getActiveDays(state: GameState): string[] {
  return Object.entries(state.ledger)
    .filter(([, day]) => day.water || day.movement || day.eating)
    .map(([date]) => date)
    .sort();
}

export interface WeekDay {
  date: string;
  /** Mon, Tue... */
  weekday: string;
  dayOfMonth: number;
  isToday: boolean;
  /** null when nothing was recorded for the day. */
  completed: number | null;
  bonus: boolean;
}

export function getLastSevenDays(state: GameState, now: number): WeekDay[] {
  const today = dateKey(now);
  return recentDateKeys(now, 7).map((date) => {
    const record = date === today && state.today.date === today ? getDailyRecord(state) : state.history[date];
    const d = new Date(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)), 12);
    const hasData = record !== undefined && (date === today || state.createdOn !== null);
    return {
      date,
      weekday: WEEKDAYS[d.getDay()],
      dayOfMonth: d.getDate(),
      isToday: date === today,
      completed: hasData && record ? Number(record.water) + Number(record.movement) + Number(record.eating) : null,
      bonus: !!record && (record.bonus || record.selfie || record.custom),
    };
  });
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface AchievementStatus {
  id: string;
  title: string;
  description: string;
  earned: boolean;
}

export function getAchievements(state: GameState): AchievementStatus[] {
  const activeDays = getActiveDays(state).length;
  const anyGoal = Object.values(state.ledger).some((d) => d.water || d.movement || d.eating);
  const earnedById: Record<string, boolean> = {
    firstStep: anyGoal,
    hatched: state.progress.xp >= STAGES[STAGE_INDEX.baby].xp,
    momentum: activeDays >= 3,
    oneWeek: activeDays >= 7,
  };
  return ACHIEVEMENTS.map((a) => ({ ...a, earned: !!earnedById[a.id] }));
}

export function getTotalGoalCompletions(state: GameState): number {
  const c = state.progress.habitCounts;
  return c.water + c.movement + c.eating;
}
