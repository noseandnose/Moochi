import { activitySatisfiesMovement, reduce } from '..';
import { DAY1, DAY2, onboarded, rewards, run } from './helpers';

function withHealth(stepTarget = 8000) {
  return reduce(onboarded(), { type: 'updateProfile', patch: { healthEnabled: true, stepTarget }, now: DAY1 }).state;
}

describe('health activity', () => {
  test('activity is recorded without completing anything while health sync is off', () => {
    const r = reduce(onboarded(), { type: 'recordActivity', steps: 12000, workoutMinutes: 60, now: DAY1 });
    expect(r.state.today.activity).toMatchObject({ steps: 12000, workoutMinutes: 60 });
    expect(r.state.today.movementDone).toBe(false);
    expect(rewards(r.events)).toHaveLength(0);
    expect(activitySatisfiesMovement(r.state)).toBe(true);
  });

  test('a workout at or above the target completes movement once', () => {
    const { state, events } = run(
      withHealth(),
      { type: 'recordActivity', steps: 1200, workoutMinutes: 12, now: DAY1 },
      { type: 'recordActivity', steps: 2600, workoutMinutes: 30, now: DAY1 + 60_000 },
      { type: 'recordActivity', steps: 2700, workoutMinutes: 45, now: DAY1 + 120_000 },
    );
    expect(state.today.movementDone).toBe(true);
    expect(state.today.movementSource).toBe('health');
    expect(rewards(events)).toEqual([{ type: 'reward', source: 'movement', xp: 25, coins: 5 }]);
    expect(events.filter((e) => e.type === 'goalCompleted')).toEqual([{ type: 'goalCompleted', goal: 'movement', source: 'health' }]);
  });

  test('steps alone can satisfy the goal', () => {
    const r = reduce(withHealth(6000), { type: 'recordActivity', steps: 6000, workoutMinutes: 0, now: DAY1 });
    expect(r.state.today.movementDone).toBe(true);
    expect(rewards(r.events)).toHaveLength(1);
  });

  test('a manual check-in is never downgraded and a manual undo is respected until new activity arrives', () => {
    const manual = run(withHealth(), { type: 'setCheckIn', goal: 'movement', done: true, now: DAY1 }).state;
    const synced = reduce(manual, { type: 'recordActivity', steps: 10, workoutMinutes: 0, now: DAY1 });
    expect(synced.state.today.movementSource).toBe('manual');
    const undone = reduce(synced.state, { type: 'setCheckIn', goal: 'movement', done: false, now: DAY1 });
    expect(undone.state.today.movementDone).toBe(false);
    // Fresh activity that meets the target completes it again, with no second reward.
    const again = reduce(undone.state, { type: 'recordActivity', steps: 9000, workoutMinutes: 0, now: DAY1 });
    expect(again.state.today.movementDone).toBe(true);
    expect(rewards(again.events)).toHaveLength(0);
  });

  test('lowering the step target in settings can complete the goal', () => {
    const s = reduce(withHealth(8000), { type: 'recordActivity', steps: 5000, workoutMinutes: 0, now: DAY1 }).state;
    expect(s.today.movementDone).toBe(false);
    const lowered = reduce(s, { type: 'updateProfile', patch: { stepTarget: 5000 }, now: DAY1 });
    expect(lowered.state.today.movementDone).toBe(true);
    expect(rewards(lowered.events)).toHaveLength(1);
    const bad = reduce(s, { type: 'updateProfile', patch: { stepTarget: 10 }, now: DAY1 });
    expect(bad.events[0]).toMatchObject({ type: 'error', code: 'invalidSteps' });
  });

  test('activity resets with the day', () => {
    const s = reduce(withHealth(), { type: 'recordActivity', steps: 9000, workoutMinutes: 0, now: DAY1 }).state;
    const next = reduce(s, { type: 'sync', now: DAY2 }).state;
    expect(next.today.activity).toBeNull();
    expect(next.today.movementDone).toBe(false);
    expect(next.history['2026-10-13'].movement).toBe(true);
  });
});
