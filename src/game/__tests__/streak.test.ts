import { STREAK, getStreakInfo, loadState, reduce } from '..';
import { DAY1, DAY2, DAY3, errors, grindDays, onboarded, run } from './helpers';

const DAY = 24 * 3600 * 1000;
const day = (n: number) => DAY1 + (n - 1) * DAY;

describe('streaks', () => {
  test('a day counts once any goal earns its reward, and today is at risk until then', () => {
    const s = onboarded();
    expect(getStreakInfo(s, DAY1)).toMatchObject({ current: 0, best: 0, todayActive: false, atRisk: false });
    const { state, events } = run(s, { type: 'addWater', ml: 2000, now: DAY1 });
    expect(events).toContainEqual({ type: 'streakExtended', streak: 1 });
    expect(getStreakInfo(state, DAY1)).toMatchObject({ current: 1, best: 1, todayActive: true, atRisk: false });
    // The next morning the streak is alive but at risk.
    expect(getStreakInfo(state, DAY2)).toMatchObject({ current: 1, atRisk: true, todayActive: false });
    const next = run(state, { type: 'setCheckIn', goal: 'eating', done: true, now: DAY2 }).state;
    expect(getStreakInfo(next, DAY2)).toMatchObject({ current: 2, best: 2, atRisk: false });
  });

  test('a second goal on the same day does not extend the streak again', () => {
    const s = run(onboarded(), { type: 'addWater', ml: 2000, now: DAY1 }).state;
    const { events } = run(s, { type: 'setCheckIn', goal: 'movement', done: true, now: DAY1 });
    expect(events.filter((e) => e.type === 'streakExtended')).toHaveLength(0);
  });

  test('undo keeps the day active because rewards stay in the ledger', () => {
    const s = run(onboarded(), { type: 'addWater', ml: 2000, now: DAY1 }, { type: 'undoWater', now: DAY1 }).state;
    expect(getStreakInfo(s, DAY1).current).toBe(1);
  });

  test('a missed day without a freeze ends the streak', () => {
    const s = grindDays(onboarded(), 2);
    const rolled = reduce(s, { type: 'sync', now: day(4) });
    expect(rolled.events).toContainEqual({ type: 'streakLost', previous: 2 });
    expect(getStreakInfo(rolled.state, day(4))).toMatchObject({ current: 0, best: 2 });
  });

  test('a freeze is earned every seven streak days and covers one missed day', () => {
    const s = grindDays(onboarded(), 7);
    expect(s.progress.streakFreezes).toBe(1);
    expect(getStreakInfo(s, day(7))).toMatchObject({ current: 7, daysToNextFreeze: 7 });
    // Skip day 8 entirely; open the app on day 9.
    const rolled = reduce(s, { type: 'sync', now: day(9) });
    expect(rolled.events).toContainEqual({ type: 'freezeUsed', date: '2026-10-20' });
    expect(rolled.state.progress.streakFreezes).toBe(0);
    expect(rolled.state.progress.frozenDays).toEqual(['2026-10-20']);
    // The frozen day counts, so the streak reads 8 and is at risk until a goal lands.
    expect(getStreakInfo(rolled.state, day(9))).toMatchObject({ current: 8, atRisk: true });
    const kept = run(rolled.state, { type: 'addWater', ml: 2000, now: day(9) }).state;
    expect(getStreakInfo(kept, day(9)).current).toBe(9);
  });

  test('freezes cover consecutive misses only while they last', () => {
    let s = grindDays(onboarded(), 14);
    expect(s.progress.streakFreezes).toBe(2);
    // Away for three days: two are frozen, the third breaks the streak.
    const rolled = reduce(s, { type: 'sync', now: day(18) });
    expect(rolled.state.progress.streakFreezes).toBe(0);
    expect(rolled.state.progress.frozenDays).toHaveLength(2);
    expect(rolled.events).toContainEqual({ type: 'streakLost', previous: 16 });
    s = rolled.state;
    expect(getStreakInfo(s, day(18))).toMatchObject({ current: 0, best: 16 });
  });

  test('freezes are capped and never spent when no streak is alive', () => {
    const s = grindDays(onboarded(), 21);
    expect(s.progress.streakFreezes).toBe(STREAK.maxFreezes);
    const broken = reduce(grindDays(onboarded(), 1), { type: 'sync', now: day(3) }).state;
    // Streak already lost; a later gap must not touch freezes.
    const again = reduce({ ...broken, progress: { ...broken.progress, streakFreezes: 1 } }, { type: 'sync', now: day(6) }).state;
    expect(again.progress.streakFreezes).toBe(1);
  });

  test('a freeze can be bought with coins up to the cap', () => {
    const s = grindDays(onboarded(), 3); // 3 days × 24 coins = 72 coins
    const bought = run(s, { type: 'buyFreeze' });
    expect(errors(bought.events)).toHaveLength(0);
    expect(bought.state.progress.streakFreezes).toBe(1);
    expect(bought.state.progress.coins).toBe(s.progress.coins - STREAK.freezeCost);
    const poor = run(bought.state, { type: 'buyFreeze' });
    expect(errors(poor.events)[0]).toMatchObject({ code: 'insufficientCoins' });
    const rich = { ...bought.state, progress: { ...bought.state.progress, coins: 500, streakFreezes: STREAK.maxFreezes } };
    expect(errors(run(rich, { type: 'buyFreeze' }).events)[0]).toMatchObject({ code: 'freezeLimit' });
  });

  test('persisted freeze data survives a round trip', () => {
    const s = grindDays(onboarded(), 7);
    const rolled = reduce(s, { type: 'sync', now: day(9) }).state;
    const json = JSON.parse(JSON.stringify(rolled));
    const loaded = loadState(json, day(9));
    if (loaded.kind !== 'ok') throw new Error(`expected ok, got ${loaded.kind}`);
    expect(loaded.state.progress.frozenDays).toEqual(rolled.progress.frozenDays);
    expect(getStreakInfo(loaded.state, day(9)).current).toBe(8);
  });

  test('perfect days count days with all three goals', () => {
    const s = run(grindDays(onboarded(), 2), { type: 'addWater', ml: 2000, now: DAY3 }).state;
    expect(getStreakInfo(s, DAY3).perfectDays).toBe(2);
  });
});
