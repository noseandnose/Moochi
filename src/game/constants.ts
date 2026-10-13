import type { BonusId, GearId, GoalId, HabitPath, PetId, StageId } from './types';

export const SCHEMA_VERSION = 1;

export const REWARDS = {
  goal: { xp: 25, coins: 5 },
  allThree: { xp: 25, coins: 5 },
  /** Each of the three bonus tiles (selfie, challenge, custom goal). */
  bonus: { xp: 20, coins: 4 },
} as const;

export const BONUSES: { id: BonusId; title: string; blurb: string }[] = [
  { id: 'selfie', title: 'Progress photo', blurb: 'Upper body, same spot, once a day. Watch yourself change.' },
  { id: 'bonus', title: 'Daily challenge', blurb: 'A small extra that changes every day.' },
  { id: 'custom', title: 'Your goal', blurb: 'A daily goal in your own words.' },
];

export const STAGES: { id: StageId; name: string; xp: number }[] = [
  { id: 'egg', name: 'Egg', xp: 0 },
  { id: 'baby', name: 'Baby', xp: 100 },
  { id: 'teen', name: 'Teen', xp: 400 },
  { id: 'adult', name: 'Adult', xp: 1000 },
  { id: 'companion', name: 'Companion', xp: 2500 },
];

export const STAGE_INDEX: Record<StageId, number> = {
  egg: 0,
  baby: 1,
  teen: 2,
  adult: 3,
  companion: 4,
};

/** Habit paths only affect appearance from the teen stage onward. */
export const PATH_STAGE_MIN = STAGE_INDEX.teen;

export const GEAR: { id: GearId; name: string; cost: number; blurb: string }[] = [
  { id: 'none', name: 'None', cost: 0, blurb: 'The classic look.' },
  { id: 'cap', name: 'Cap', cost: 70, blurb: 'A snapback with a sage brim.' },
  { id: 'bow', name: 'Bow', cost: 80, blurb: 'A neat ribbon, worn off-centre.' },
  { id: 'glasses', name: 'Glasses', cost: 100, blurb: 'Round frames. Very studious.' },
  { id: 'scarf', name: 'Scarf', cost: 120, blurb: 'A knitted scarf for cold mornings.' },
  { id: 'crown', name: 'Crown', cost: 180, blurb: 'Gold. Earned, not given.' },
];

export const GEAR_BY_ID = Object.fromEntries(GEAR.map((g) => [g.id, g])) as Record<
  GearId,
  (typeof GEAR)[number]
>;

export const PETS: {
  id: PetId;
  name: string;
  personality: string;
  traits: [string, string, string];
  habitat: string;
}[] = [
  {
    id: 'tofu',
    name: 'Tofu',
    personality: 'Curious. Playful. Independent.',
    traits: ['Curious', 'Playful', 'Independent'],
    habitat: 'Rooftops',
  },
  {
    id: 'juno',
    name: 'Juno',
    personality: 'Calm. Watchful. Sharp.',
    traits: ['Calm', 'Watchful', 'Sharp'],
    habitat: 'Twilight pines',
  },
  {
    id: 'pebble',
    name: 'Pebble',
    personality: 'Easygoing. Patient. Resilient.',
    traits: ['Easygoing', 'Patient', 'Resilient'],
    habitat: 'Pond',
  },
  {
    id: 'ori',
    name: 'Ori',
    personality: 'Bold. Steady. Determined.',
    traits: ['Bold', 'Steady', 'Determined'],
    habitat: 'Snow coast',
  },
  {
    id: 'fern',
    name: 'Fern',
    personality: 'Gentle. Grounded. Growing.',
    traits: ['Gentle', 'Grounded', 'Growing'],
    habitat: 'Mushroom glade',
  },
];

export const PET_BY_ID = Object.fromEntries(PETS.map((p) => [p.id, p])) as Record<
  PetId,
  (typeof PETS)[number]
>;

export const PATHS: { id: HabitPath; name: string; blurb: string }[] = [
  { id: 'balanced', name: 'Balanced', blurb: 'An even mix of habits. The base look.' },
  { id: 'hydration', name: 'Hydration', blurb: 'Water leads. Cool accents and a drop charm.' },
  { id: 'active', name: 'Active', blurb: 'Movement leads. A training headband and wraps.' },
  { id: 'nourished', name: 'Nourished', blurb: 'Eating well leads. Leaf and sprout accents.' },
];

export const PATH_BY_ID = Object.fromEntries(PATHS.map((p) => [p.id, p])) as Record<
  HabitPath,
  (typeof PATHS)[number]
>;

export const GOALS: { id: GoalId; title: string }[] = [
  { id: 'water', title: 'Drink water' },
  { id: 'movement', title: 'Move your body' },
  { id: 'eating', title: 'Eat well' },
];

export const CHALLENGES = [
  'Stretch for 5 minutes',
  'Take a 10-minute walk',
  'Add a vegetable to a meal',
  'Take a short movement break',
  'Drink water with breakfast',
  'Do 5 minutes of gentle mobility',
  'Prepare a balanced snack',
];

export const DEFAULTS = {
  petName: 'Mochi',
  waterTargetFemaleMl: 2000,
  waterTargetMaleMl: 3000,
  waterTargetUnspecifiedMl: 2500,
  movementMinutes: 30,
  eatingGoal: 'Eat a balanced meal',
  customGoal: '',
  stepTarget: 8000,
  minStepTarget: 1000,
  maxStepTarget: 50000,
  maxCustomGoalLength: 60,
  maxPetNameLength: 20,
  maxEatingGoalLength: 90,
  minMovementMinutes: 1,
  maxMovementMinutes: 240,
  /** A single water entry above this is treated as a typo. */
  maxSingleEntryMl: 5000,
  minWaterTargetMl: 100,
  maxWaterTargetMl: 10000,
} as const;

export const LEVEL_XP = 100;

/** Hours without any interaction before the pet falls asleep. */
export const ASLEEP_AFTER_HOURS = 36;

/**
 * Streaks: a day counts once any of the three goals earns its reward. A
 * freeze covers one missed day; one is earned every seven streak days and
 * they can also be bought with coins.
 */
export const STREAK = {
  freezeEveryDays: 7,
  maxFreezes: 2,
  freezeCost: 60,
  /** Local time for the midday water nudge and the evening streak warning. */
  waterNudgeHour: 13,
  waterNudgeMinute: 0,
  streakWarningHour: 20,
  streakWarningMinute: 30,
} as const;

export const ACHIEVEMENTS: { id: string; title: string; description: string }[] = [
  { id: 'firstStep', title: 'First step', description: 'Complete a daily goal' },
  { id: 'hatched', title: 'Hatched', description: 'Reach 100 XP' },
  {
    id: 'momentum',
    title: 'Building momentum',
    description: 'Complete goals on 3 different days',
  },
  {
    id: 'oneWeek',
    title: 'One week stronger',
    description: 'Complete goals on 7 different days',
  },
];
