import { getPetMood, moodLine, reduce } from '..';
import { DAY1, onboarded, run } from './helpers';

const H = 3600 * 1000;

describe('pet mood', () => {
  test('follows the first unfinished goal: water, then eating, then movement', () => {
    const s = onboarded();
    expect(getPetMood(s, DAY1)).toBe('thirsty');
    const watered = run(s, { type: 'addWater', ml: 2000, now: DAY1 }).state;
    expect(getPetMood(watered, DAY1)).toBe('hungry');
    const fed = run(watered, { type: 'setCheckIn', goal: 'eating', done: true, now: DAY1 }).state;
    expect(getPetMood(fed, DAY1)).toBe('lazy');
    const moved = run(fed, { type: 'setCheckIn', goal: 'movement', done: true, now: DAY1 }).state;
    expect(getPetMood(moved, DAY1)).toBe('content');
  });

  test('falls asleep after 36 hours without interaction and wakes on any action', () => {
    const s = run(onboarded(), { type: 'addWater', ml: 300, now: DAY1 }).state;
    expect(s.lastActiveAt).toBe(DAY1);
    expect(getPetMood(s, DAY1 + 35 * H)).toBe('thirsty');
    expect(getPetMood(s, DAY1 + 36 * H)).toBe('asleep');
    // Health syncs and date rollovers are not interactions.
    const synced = reduce(s, { type: 'recordActivity', steps: 100, workoutMinutes: 0, now: DAY1 + 40 * H }).state;
    expect(synced.lastActiveAt).toBe(DAY1);
    expect(getPetMood(synced, DAY1 + 40 * H)).toBe('asleep');
    const awake = reduce(synced, { type: 'setCheckIn', goal: 'eating', done: true, now: DAY1 + 40 * H }).state;
    expect(awake.lastActiveAt).toBe(DAY1 + 40 * H);
    expect(getPetMood(awake, DAY1 + 40 * H)).toBe('thirsty');
  });

  test('mood lines name the pet and the next action', () => {
    expect(moodLine('thirsty', 'Tofu')).toContain('water');
    expect(moodLine('asleep', 'Tofu')).toContain('Tofu');
  });
});
