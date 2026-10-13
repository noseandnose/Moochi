import { createInitialState, reduce } from '..';
import type { GameAction, GameEvent, GameState, OnboardingInput } from '..';

export const DAY1 = new Date(2026, 9, 13, 9, 0, 0).getTime();
export const DAY1_EVENING = new Date(2026, 9, 13, 21, 30, 0).getTime();
export const DAY2 = new Date(2026, 9, 14, 8, 0, 0).getTime();
export const DAY3 = new Date(2026, 9, 15, 8, 0, 0).getTime();

export const INPUT: OnboardingInput = {
  petId: 'foxi',
  petName: 'Pip',
  gender: 'female',
  waterUnit: 'ml',
  waterTargetMl: 2000,
  movementMinutes: 30,
  eatingGoal: 'Eat a balanced meal',
};

export function onboarded(now = DAY1, input: Partial<OnboardingInput> = {}): GameState {
  return reduce(createInitialState(), {
    type: 'completeOnboarding',
    input: { ...INPUT, ...input },
    now,
  }).state;
}

/** Applies actions in sequence, collecting every event. */
export function run(state: GameState, ...actions: GameAction[]): { state: GameState; events: GameEvent[] } {
  const events: GameEvent[] = [];
  let s = state;
  for (const a of actions) {
    const r = reduce(s, a);
    s = r.state;
    events.push(...r.events);
  }
  return { state: s, events };
}

export function rewards(events: GameEvent[]) {
  return events.filter((e) => e.type === 'reward');
}

export function errors(events: GameEvent[]) {
  return events.filter((e) => e.type === 'error');
}

/** Grants XP through legitimate goal completions across consecutive days. */
export function grindDays(state: GameState, days: number, startDay = DAY1): GameState {
  let s = state;
  for (let i = 0; i < days; i++) {
    const now = startDay + i * 24 * 3600 * 1000;
    s = run(
      s,
      { type: 'addWater', ml: 2000, now },
      { type: 'setCheckIn', goal: 'movement', done: true, now },
      { type: 'setCheckIn', goal: 'eating', done: true, now },
      { type: 'setCheckIn', goal: 'bonus', done: true, now },
    ).state;
  }
  return s;
}
