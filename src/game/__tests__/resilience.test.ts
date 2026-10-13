import { SCHEMA_VERSION, getPetMood, getStreakInfo, isDateKey, loadState, reduce } from '..';
import { DAY1, DAY2, grindDays, onboarded, run } from './helpers';

const DAY = 24 * 3600 * 1000;
const day = (n: number) => DAY1 + (n - 1) * DAY;

describe('clock and storage resilience', () => {
  test('a clock that moves backwards never wipes the stored day', () => {
    const s = grindDays(onboarded(), 2); // Oct 13 and Oct 14 recorded, today = Oct 14
    const back = reduce(s, { type: 'sync', now: DAY1 + 2 * 3600 * 1000 }); // "Oct 13 again"
    expect(back.events).toEqual([]);
    expect(back.state).toBe(s);
    const later = run(back.state, { type: 'addWater', ml: 300, now: DAY1 }).state;
    expect(later.history['2026-10-13']).toMatchObject({ water: true, movement: true, eating: true });
    expect(later.today.date).toBe('2026-10-14');
  });

  test('data from a newer schema is refused instead of silently downgraded', () => {
    const out = loadState({ ...onboarded(), schemaVersion: SCHEMA_VERSION + 1 });
    expect(out.kind).toBe('corrupt');
  });

  test('the streak reads through unspent freezes before the day has rolled over', () => {
    const s = grindDays(onboarded(), 7); // one freeze earned
    const info = getStreakInfo(s, day(9)); // day 8 missed, app not yet opened on day 9
    expect(info).toMatchObject({ current: 8, atRisk: true, freezes: 0 });
    const rolled = reduce(s, { type: 'sync', now: day(9) }).state;
    expect(getStreakInfo(rolled, day(9))).toMatchObject({ current: 8, atRisk: true, freezes: 0 });
  });

  test('a lost today.date still spends freezes from the last recorded day', () => {
    const s = grindDays(onboarded(), 7);
    const damaged = { ...s, today: { ...s.today, date: '' } };
    const rolled = reduce(damaged, { type: 'sync', now: day(9) });
    expect(rolled.events).toContainEqual({ type: 'freezeUsed', date: '2026-10-20' });
    expect(getStreakInfo(rolled.state, day(9)).current).toBe(8);
  });

  test('sanitizer drops future frozen days, impossible dates, unsafe photo names and future activity', () => {
    const s = grindDays(onboarded(), 1);
    const tampered = {
      ...s,
      lastActiveAt: DAY2 + 1000 * DAY,
      progress: { ...s.progress, frozenDays: ['2026-10-14', '2026-10-15', '2026-13-45', '2026-10-12'] },
      selfies: [
        { date: '2026-10-13', file: '../../etc/passwd', at: DAY1 },
        { date: '2026-10-12', file: 'selfie-2026-10-12.jpg', at: DAY1 },
      ],
    };
    const out = loadState(tampered, DAY2);
    if (out.kind !== 'ok') throw new Error(out.kind);
    expect(out.state.progress.frozenDays).toEqual(['2026-10-12']);
    expect(out.state.selfies.map((x) => x.file)).toEqual(['selfie-2026-10-12.jpg']);
    expect(out.state.lastActiveAt).toBe(DAY2);
    expect(isDateKey('2026-02-30')).toBe(false);
    expect(isDateKey('2028-02-29')).toBe(true);
  });

  test('touching the pet counts as activity and wakes it', () => {
    const s = run(onboarded(), { type: 'addWater', ml: 300, now: DAY1 }).state;
    const later = DAY1 + 40 * 3600 * 1000;
    expect(getPetMood(s, later)).toBe('asleep');
    const woke = reduce(s, { type: 'wake', now: later }).state;
    expect(woke.lastActiveAt).toBe(later);
    expect(getPetMood(woke, later)).not.toBe('asleep');
    expect(woke.progress.xp).toBe(s.progress.xp);
  });
});
