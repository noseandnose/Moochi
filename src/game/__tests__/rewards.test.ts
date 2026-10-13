import { getCompletedCount, getStage, isWaterDone, reduce } from '..';
import { DAY1, DAY1_EVENING, DAY2, errors, onboarded, rewards, run } from './helpers';

describe('rewards ledger', () => {
  test('each daily goal awards 25 XP and 5 coins exactly once', () => {
    const { state, events } = run(
      onboarded(),
      { type: 'setCheckIn', goal: 'movement', done: true, now: DAY1 },
      { type: 'setCheckIn', goal: 'movement', done: true, now: DAY1 },
      { type: 'setCheckIn', goal: 'movement', done: false, now: DAY1 },
      { type: 'setCheckIn', goal: 'movement', done: true, now: DAY1 },
    );
    expect(rewards(events)).toEqual([{ type: 'reward', source: 'movement', xp: 25, coins: 5 }]);
    expect(state.progress.xp).toBe(25);
    expect(state.progress.coins).toBe(5);
    expect(state.progress.habitCounts.movement).toBe(1);
  });

  test('undo keeps the day honest without revoking or re-awarding', () => {
    const first = run(onboarded(), { type: 'setCheckIn', goal: 'eating', done: true, now: DAY1 });
    const undone = reduce(first.state, { type: 'setCheckIn', goal: 'eating', done: false, now: DAY1 });
    expect(undone.events).toContainEqual({ type: 'goalUndone', goal: 'eating' });
    expect(undone.state.today.eatingDone).toBe(false);
    expect(undone.state.history['2026-10-13'].eating).toBe(false);
    expect(undone.state.progress.xp).toBe(25);
    const redone = reduce(undone.state, { type: 'setCheckIn', goal: 'eating', done: true, now: DAY1 });
    expect(rewards(redone.events)).toHaveLength(0);
    expect(redone.state.progress.xp).toBe(25);
    expect(redone.state.progress.habitCounts.eating).toBe(1);
  });

  test('water goal completes when the target is reached and awards once', () => {
    const { state, events } = run(
      onboarded(),
      { type: 'addWater', ml: 500, now: DAY1 },
      { type: 'addWater', ml: 500, now: DAY1 },
      { type: 'addWater', ml: 500, now: DAY1 },
      { type: 'addWater', ml: 499.6, now: DAY1 },
    );
    expect(isWaterDone(state)).toBe(true);
    expect(rewards(events)).toEqual([{ type: 'reward', source: 'water', xp: 25, coins: 5 }]);
    expect(events.filter((e) => e.type === 'goalCompleted')).toEqual([{ type: 'goalCompleted', goal: 'water' }]);
    // Undo the last drink: the goal reads incomplete again, rewards stay.
    const undone = reduce(state, { type: 'undoWater', now: DAY1 });
    expect(isWaterDone(undone.state)).toBe(false);
    expect(undone.events).toContainEqual({ type: 'goalUndone', goal: 'water' });
    expect(undone.state.progress.xp).toBe(25);
    const again = reduce(undone.state, { type: 'addWater', ml: 600, now: DAY1 });
    expect(rewards(again.events)).toHaveLength(0);
    expect(again.state.progress.xp).toBe(25);
  });

  test('completing all three adds a 25 XP / 5 coin bonus', () => {
    const { state, events } = run(
      onboarded(),
      { type: 'addWater', ml: 2000, now: DAY1 },
      { type: 'setCheckIn', goal: 'movement', done: true, now: DAY1 },
      { type: 'setCheckIn', goal: 'eating', done: true, now: DAY1 },
    );
    expect(getCompletedCount(state)).toBe(3);
    expect(rewards(events).map((r) => r.source)).toEqual(['water', 'movement', 'eating', 'allThree']);
    expect(events).toContainEqual({ type: 'allGoalsCompleted' });
    expect(state.progress.xp).toBe(100);
    expect(state.progress.coins).toBe(20);
    expect(getStage(state)).toBe('baby');
    expect(events).toContainEqual({ type: 'stageChanged', from: 'egg', to: 'baby' });
  });

  test('the optional challenge awards 20 XP and 4 coins once', () => {
    const { state, events } = run(
      onboarded(),
      { type: 'setCheckIn', goal: 'bonus', done: true, now: DAY1 },
      { type: 'setCheckIn', goal: 'bonus', done: false, now: DAY1 },
      { type: 'setCheckIn', goal: 'bonus', done: true, now: DAY1 },
    );
    expect(rewards(events)).toEqual([{ type: 'reward', source: 'bonus', xp: 20, coins: 4 }]);
    expect(state.progress.habitCounts).toEqual({ water: 0, movement: 0, eating: 0 });
  });

  test('rewards reset with the local calendar day but progress stays', () => {
    const day1 = run(
      onboarded(),
      { type: 'addWater', ml: 2000, now: DAY1 },
      { type: 'setCheckIn', goal: 'movement', done: true, now: DAY1_EVENING },
    ).state;
    const day2 = reduce(day1, { type: 'setCheckIn', goal: 'movement', done: true, now: DAY2 });
    expect(day2.events).toContainEqual({ type: 'dayRolled', from: '2026-10-13', to: '2026-10-14' });
    expect(rewards(day2.events)).toEqual([{ type: 'reward', source: 'movement', xp: 25, coins: 5 }]);
    expect(day2.state.today.waterEntries).toHaveLength(0);
    expect(day2.state.today.date).toBe('2026-10-14');
    expect(day2.state.progress.xp).toBe(75);
    expect(day2.state.history['2026-10-13']).toEqual({ water: true, movement: true, eating: false, bonus: false, selfie: false, custom: false });
    expect(day2.state.ledger['2026-10-13']).toEqual({ water: true, movement: true });
    expect(day2.state.ledger['2026-10-14']).toEqual({ movement: true });
  });

  test('sync on resume rolls the day without duplicating history', () => {
    const day1 = run(onboarded(), { type: 'setCheckIn', goal: 'eating', done: true, now: DAY1 }).state;
    const a = reduce(day1, { type: 'sync', now: DAY2 });
    const b = reduce(a.state, { type: 'sync', now: DAY2 });
    expect(a.events).toHaveLength(1);
    expect(b.events).toHaveLength(0);
    expect(Object.keys(b.state.history)).toEqual(['2026-10-13']);
    expect(b.state.today).toEqual({
      date: '2026-10-14',
      waterEntries: [],
      movementDone: false,
      movementSource: null,
      eatingDone: false,
      bonusDone: false,
      selfieDone: false,
      customDone: false,
      activity: null,
    });
  });

  test('invalid water amounts are rejected without changing state', () => {
    const start = onboarded();
    for (const ml of [0, -10, NaN, Infinity, 6000]) {
      const r = reduce(start, { type: 'addWater', ml, now: DAY1 });
      expect(errors(r.events)).toHaveLength(1);
      expect(r.state).toBe(start);
    }
    const undo = reduce(start, { type: 'undoWater', now: DAY1 });
    expect(errors(undo.events)[0]).toMatchObject({ code: 'nothingToUndo' });
  });

  test('lowering the target in settings can complete the water goal once', () => {
    const start = run(onboarded(), { type: 'addWater', ml: 1500, now: DAY1 }).state;
    const lowered = reduce(start, { type: 'updateProfile', patch: { waterTargetMl: 1500 }, now: DAY1 });
    expect(rewards(lowered.events)).toEqual([{ type: 'reward', source: 'water', xp: 25, coins: 5 }]);
    const raised = reduce(lowered.state, { type: 'updateProfile', patch: { waterTargetMl: 3000 }, now: DAY1 });
    expect(isWaterDone(raised.state)).toBe(false);
    const loweredAgain = reduce(raised.state, { type: 'updateProfile', patch: { waterTargetMl: 1000 }, now: DAY1 });
    expect(rewards(loweredAgain.events)).toHaveLength(0);
  });
});
