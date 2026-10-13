import { getBonusCount, getTodaySelfie, reduce } from '..';
import { DAY1, DAY2, errors, onboarded, rewards, run } from './helpers';

describe('bonus tiles', () => {
  test('a progress selfie earns 20 XP and 4 coins once per day', () => {
    const { state, events } = run(
      onboarded(),
      { type: 'recordSelfie', file: '2026-10-13.jpg', now: DAY1 },
      { type: 'recordSelfie', file: '2026-10-13-retake.jpg', now: DAY1 + 1000 },
    );
    expect(rewards(events)).toEqual([{ type: 'reward', source: 'selfie', xp: 20, coins: 4 }]);
    expect(events.filter((e) => e.type === 'goalCompleted')).toEqual([{ type: 'goalCompleted', goal: 'selfie' }]);
    expect(state.selfies).toHaveLength(1);
    expect(getTodaySelfie(state)?.file).toBe('2026-10-13-retake.jpg');
    expect(state.today.selfieDone).toBe(true);
    expect(state.history['2026-10-13'].selfie).toBe(true);
  });

  test('removing a selfie clears the check-in but keeps the reward', () => {
    const start = run(onboarded(), { type: 'recordSelfie', file: 'a.jpg', now: DAY1 }).state;
    const removed = reduce(start, { type: 'removeSelfie', date: '2026-10-13', now: DAY1 });
    expect(removed.state.selfies).toHaveLength(0);
    expect(removed.state.today.selfieDone).toBe(false);
    expect(removed.state.progress.xp).toBe(20);
    expect(removed.events).toContainEqual({ type: 'goalUndone', goal: 'selfie' });
    const again = reduce(removed.state, { type: 'recordSelfie', file: 'b.jpg', now: DAY1 });
    expect(rewards(again.events)).toHaveLength(0);
  });

  test('selfies keep one entry per day across days', () => {
    const s = run(
      onboarded(),
      { type: 'recordSelfie', file: 'a.jpg', now: DAY1 },
      { type: 'recordSelfie', file: 'b.jpg', now: DAY2 },
    ).state;
    expect(s.selfies.map((x) => x.date)).toEqual(['2026-10-13', '2026-10-14']);
    expect(s.today.selfieDone).toBe(true);
    expect(s.history['2026-10-13'].selfie).toBe(true);
  });

  test('the custom goal needs text before it can be completed', () => {
    const blocked = reduce(onboarded(), { type: 'setCheckIn', goal: 'custom', done: true, now: DAY1 });
    expect(errors(blocked.events)[0]).toMatchObject({ code: 'noCustomGoal' });
    const withGoal = reduce(onboarded(), { type: 'updateProfile', patch: { customGoal: '  Read 10 pages  ' }, now: DAY1 }).state;
    expect(withGoal.profile.customGoal).toBe('Read 10 pages');
    const done = reduce(withGoal, { type: 'setCheckIn', goal: 'custom', done: true, now: DAY1 });
    expect(rewards(done.events)).toEqual([{ type: 'reward', source: 'custom', xp: 20, coins: 4 }]);
    expect(getBonusCount(done.state)).toBe(1);
    // Clearing the goal clears the check-in; the reward stays.
    const cleared = reduce(done.state, { type: 'updateProfile', patch: { customGoal: '' }, now: DAY1 }).state;
    expect(cleared.today.customDone).toBe(false);
    expect(cleared.progress.xp).toBe(20);
  });

  test('all three bonuses stack with the daily goals', () => {
    const withGoal = reduce(onboarded(), { type: 'updateProfile', patch: { customGoal: 'Stretch' }, now: DAY1 }).state;
    const { state, events } = run(
      withGoal,
      { type: 'recordSelfie', file: 'a.jpg', now: DAY1 },
      { type: 'setCheckIn', goal: 'bonus', done: true, now: DAY1 },
      { type: 'setCheckIn', goal: 'custom', done: true, now: DAY1 },
    );
    expect(rewards(events).map((r) => r.source)).toEqual(['selfie', 'bonus', 'custom']);
    expect(state.progress.xp).toBe(60);
    expect(state.progress.coins).toBe(12);
    expect(getBonusCount(state)).toBe(3);
    expect(state.ledger['2026-10-13']).toEqual({ selfie: true, bonus: true, custom: true });
    // Bonuses never change habit counts or the evolution path.
    expect(state.progress.habitCounts).toEqual({ water: 0, movement: 0, eating: 0 });
  });
});
