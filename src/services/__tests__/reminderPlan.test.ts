import { reduce } from '@/game';
import { DAY1, grindDays, onboarded, run } from '@/game/__tests__/helpers';

import { planReminders } from '../reminderPlan';

const at = (h: number, m = 0) => new Date(2026, 9, 13, h, m).getTime();
const withReminders = (s = onboarded()) => reduce(s, { type: 'updatePrefs', patch: { reminderEnabled: true } }).state;
const ids = (plan: ReturnType<typeof planReminders>) => plan.map((p) => p.id).sort();

describe('reminder planning', () => {
  test('nothing is planned while reminders are off', () => {
    expect(planReminders(onboarded(), at(9))).toEqual([]);
  });

  test('morning: evening reminder names the first missing goal, water nudge counts what is left', () => {
    const s = run(withReminders(), { type: 'addWater', ml: 500, now: at(9) }).state;
    const plan = planReminders(s, at(9));
    expect(ids(plan)).toEqual(['evening', 'water']);
    const evening = plan.find((p) => p.id === 'evening')!;
    expect(evening.body).toBe('Pip is thirsty. Log some water.');
    expect(evening.at.getHours()).toBe(19);
    expect(evening.at.getDate()).toBe(13);
    expect(plan.find((p) => p.id === 'water')!.body).toBe('Pip is thirsty. 1,500 ml to go.');
  });

  test('the evening reminder moves on to eating, then movement, and goes quiet when all three are done', () => {
    const watered = run(withReminders(), { type: 'addWater', ml: 2000, now: at(9) }).state;
    expect(planReminders(watered, at(9)).find((p) => p.id === 'evening')!.body).toContain('hungry');
    expect(ids(planReminders(watered, at(9)))).toEqual(['evening']); // water nudge dropped
    const fed = run(watered, { type: 'setCheckIn', goal: 'eating', done: true, now: at(9) }).state;
    expect(planReminders(fed, at(9)).find((p) => p.id === 'evening')!.body).toContain('lazy');
    const done = run(fed, { type: 'setCheckIn', goal: 'movement', done: true, now: at(9) }).state;
    expect(planReminders(done, at(9)).find((p) => p.id === 'evening')).toBeUndefined();
  });

  test('once a slot has passed it is planned for tomorrow with a line that is true at the start of a day', () => {
    const plan = planReminders(withReminders(), at(22));
    const evening = plan.find((p) => p.id === 'evening')!;
    expect(evening.at.getDate()).toBe(14);
    expect(evening.body).toBe('A new day for Pip. Three goals, one at a time.');
    const water = plan.find((p) => p.id === 'water')!;
    expect(water.at.getDate()).toBe(14);
    expect(water.at.getHours()).toBe(13);
  });

  test('streak warning fires only while a streak is at risk, and folds into a nearby evening reminder', () => {
    // Days 13..15 active; the evening reminder sits at 18:00, well before the 20:30 warning.
    const s = reduce(withReminders(grindDays(onboarded(), 3)), { type: 'updatePrefs', patch: { reminderHour: 18, reminderMinute: 0 } }).state;
    const morning16 = new Date(2026, 9, 16, 9).getTime();
    const plan = planReminders(s, morning16);
    expect(ids(plan)).toEqual(['evening', 'streak', 'water']);
    expect(plan.find((p) => p.id === 'streak')!.body).toBe('Your 3-day streak ends at midnight. One goal keeps it going.');
    expect(plan.find((p) => p.id === 'evening')!.body).toContain('Your 3-day streak ends at midnight.');
    // Evening reminder at 20:00 is within 90 minutes of the warning: no separate warning.
    const close = reduce(s, { type: 'updatePrefs', patch: { reminderHour: 20, reminderMinute: 0 } }).state;
    expect(ids(planReminders(close, morning16))).toEqual(['evening', 'water']);
    // Today earned: no warning today, but one for tomorrow night.
    const earned = run(s, { type: 'addWater', ml: 2000, now: morning16 }).state;
    const later = planReminders(earned, new Date(2026, 9, 16, 21).getTime());
    const warn = later.find((p) => p.id === 'streak')!;
    expect(warn.at.getDate()).toBe(17);
    expect(warn.body).toBe('Your 4-day streak ends tonight unless you log one goal.');
  });

  test('nudges can be turned off, leaving only the evening reminder', () => {
    const s = reduce(withReminders(), { type: 'updatePrefs', patch: { nudgesEnabled: false } }).state;
    expect(ids(planReminders(s, DAY1))).toEqual(['evening']);
  });
});
