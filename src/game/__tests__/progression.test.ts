import {
  STAGES,
  createInitialState,
  getAchievements,
  getActiveDays,
  getGrowth,
  getHabitPath,
  getLastSevenDays,
  getLevel,
  getVisualPath,
  pathForCounts,
  stageForXp,
} from '..';
import type { GameState } from '..';
import { DAY1, DAY2, grindDays, onboarded, run } from './helpers';

function withXp(xp: number): GameState {
  const s = onboarded();
  return { ...s, progress: { ...s.progress, xp } };
}

describe('growth stages', () => {
  test.each([
    [0, 'egg'],
    [99, 'egg'],
    [100, 'baby'],
    [399, 'baby'],
    [400, 'teen'],
    [999, 'teen'],
    [1000, 'adult'],
    [2499, 'adult'],
    [2500, 'companion'],
    [9000, 'companion'],
  ] as const)('%i XP is the %s stage', (xp, stage) => {
    expect(stageForXp(xp)).toBe(stage);
  });

  test('thresholds match the spec', () => {
    expect(STAGES.map((s) => s.xp)).toEqual([0, 100, 400, 1000, 2500]);
  });

  test('growth info reports XP to the next stage', () => {
    const g = getGrowth(withXp(450));
    expect(g).toMatchObject({ stage: 'teen', nextStage: 'adult', xpToNext: 550, level: 5 });
    expect(g.progress).toBeCloseTo(50 / 600);
  });

  test('levels continue after the final stage', () => {
    const g = getGrowth(withXp(2640));
    expect(g.isFinalStage).toBe(true);
    expect(g.level).toBe(27);
    expect(getLevel(withXp(0))).toBe(1);
    expect(getLevel(withXp(99))).toBe(1);
    expect(getLevel(withXp(100))).toBe(2);
    expect(g.xpToNext).toBe(60);
  });

  test('a full day of goals earns 120 XP and the egg hatches', () => {
    const s = grindDays(onboarded(), 1);
    expect(s.progress.xp).toBe(120);
    expect(getGrowth(s).stage).toBe('baby');
    const s4 = grindDays(onboarded(), 4);
    expect(s4.progress.xp).toBe(480);
    expect(getGrowth(s4).stage).toBe('teen');
  });
});

describe('habit paths', () => {
  test('ties and no data are balanced', () => {
    expect(pathForCounts({ water: 0, movement: 0, eating: 0 })).toBe('balanced');
    expect(pathForCounts({ water: 2, movement: 2, eating: 1 })).toBe('balanced');
    expect(pathForCounts({ water: 3, movement: 3, eating: 3 })).toBe('balanced');
  });

  test('a single leader picks the path', () => {
    expect(pathForCounts({ water: 3, movement: 2, eating: 1 })).toBe('hydration');
    expect(pathForCounts({ water: 1, movement: 4, eating: 1 })).toBe('active');
    expect(pathForCounts({ water: 1, movement: 2, eating: 5 })).toBe('nourished');
  });

  test('appearance follows the path only from the teen stage', () => {
    const base = onboarded();
    const hydrated: GameState = {
      ...base,
      progress: { ...base.progress, xp: 150, habitCounts: { water: 3, movement: 0, eating: 0 } },
    };
    expect(getHabitPath(hydrated)).toBe('hydration');
    expect(getVisualPath(hydrated)).toBe('balanced');
    const teen = { ...hydrated, progress: { ...hydrated.progress, xp: 400 } };
    expect(getVisualPath(teen)).toBe('hydration');
  });

  test('counters cannot be inflated by undo and redo', () => {
    const { state } = run(
      onboarded(),
      { type: 'addWater', ml: 2000, now: DAY1 },
      { type: 'undoWater', now: DAY1 },
      { type: 'addWater', ml: 2000, now: DAY1 },
      { type: 'undoWater', now: DAY1 },
      { type: 'addWater', ml: 2000, now: DAY1 },
    );
    expect(state.progress.habitCounts.water).toBe(1);
  });
});

describe('journey', () => {
  test('achievements use distinct days, not streaks', () => {
    const fresh = createInitialState();
    expect(getAchievements(fresh).every((a) => !a.earned)).toBe(true);
    const oneGoal = run(onboarded(), { type: 'setCheckIn', goal: 'movement', done: true, now: DAY1 }).state;
    expect(getAchievements(oneGoal).find((a) => a.id === 'firstStep')?.earned).toBe(true);
    expect(getAchievements(oneGoal).find((a) => a.id === 'hatched')?.earned).toBe(false);

    // Three non-consecutive days.
    const gap = 3 * 24 * 3600 * 1000;
    let s = onboarded();
    for (let i = 0; i < 3; i++) {
      s = run(s, { type: 'setCheckIn', goal: 'eating', done: true, now: DAY1 + i * gap }).state;
    }
    expect(getActiveDays(s)).toHaveLength(3);
    expect(getAchievements(s).find((a) => a.id === 'momentum')?.earned).toBe(true);
    expect(getAchievements(s).find((a) => a.id === 'oneWeek')?.earned).toBe(false);
    const week = grindDays(onboarded(), 7);
    expect(getAchievements(week).every((a) => a.earned)).toBe(true);
  });

  test('bonus challenges do not count as active days', () => {
    const s = run(onboarded(), { type: 'setCheckIn', goal: 'bonus', done: true, now: DAY1 }).state;
    expect(getActiveDays(s)).toHaveLength(0);
  });

  test('last seven days shows dashes for days without records', () => {
    const s = run(
      onboarded(),
      { type: 'setCheckIn', goal: 'movement', done: true, now: DAY1 },
      { type: 'addWater', ml: 2000, now: DAY2 },
    ).state;
    const week = getLastSevenDays(s, DAY2);
    expect(week).toHaveLength(7);
    expect(week[6]).toMatchObject({ date: '2026-10-14', isToday: true, completed: 1 });
    expect(week[5]).toMatchObject({ date: '2026-10-13', completed: 1 });
    expect(week.slice(0, 5).every((d) => d.completed === null)).toBe(true);
    expect(week.map((d) => d.weekday)).toEqual(['Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed']);
  });
});
