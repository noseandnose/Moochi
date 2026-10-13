import { STREAK, dateKey, formatWater, getCompletedCount, getStreakInfo, getWaterConsumedMl, isWaterDone, type GameState } from '@/game';

import type { PlannedReminder } from './notifications';

const TITLE = 'YOUchi';

/**
 * Decides which local notifications should exist right now, from the game
 * state alone. Pure, so it is unit-tested; the ReminderSync component
 * hands the result to the notification service after every change.
 *
 * - Evening reminder (user's time): the first unfinished goal, phrased as
 *   the pet's need. Silent when all three are done.
 * - Midday water nudge: only while water is behind.
 * - Streak warning: only while a streak is alive and today is not earned.
 *   Folded into the evening reminder when the two would fire close together.
 * When a slot has already passed today it is planned for tomorrow with a
 * line that is true at the start of any day; the next app open re-plans it.
 */
export function planReminders(state: GameState, now: number): PlannedReminder[] {
  const { reminderEnabled, nudgesEnabled, reminderHour, reminderMinute } = state.prefs;
  if (!reminderEnabled) return [];
  const pet = state.profile.petName;
  const plan: PlannedReminder[] = [];
  const at = (hour: number, minute: number, dayOffset: number) => {
    const d = new Date(now);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + dayOffset, hour, minute, 0, 0);
  };
  const sameDay = state.today.date === dateKey(now);
  const completed = sameDay ? getCompletedCount(state) : 0;
  const waterDone = sameDay && isWaterDone(state);
  const streak = getStreakInfo(state, now);
  const atRisk = sameDay ? streak.atRisk : streak.current > 0;
  const streakLine = atRisk ? ` Your ${streak.current}-day streak ends at midnight.` : '';
  // Tomorrow the streak is at risk from the start of the day whenever it is alive tonight.
  const aliveTomorrow = sameDay && streak.todayActive ? streak.current : atRisk && streak.freezes > 0 ? streak.current + 1 : 0;
  const tomorrowStreakLine = aliveTomorrow > 0 ? ` Your ${aliveTomorrow}-day streak ends at midnight.` : '';

  // Evening reminder: today while something is left, otherwise tomorrow.
  const evening = at(reminderHour, reminderMinute, 0);
  const eveningToday = evening.getTime() > now && completed < 3;
  if (eveningToday) {
    plan.push({ id: 'evening', at: evening, title: TITLE, body: needLine(state, sameDay) + streakLine });
  } else {
    plan.push({ id: 'evening', at: at(reminderHour, reminderMinute, 1), title: TITLE, body: `A new day for ${pet}. Three goals, one at a time.${tomorrowStreakLine}` });
  }

  if (!nudgesEnabled) return plan;

  // Midday water nudge: today while water is behind, otherwise tomorrow.
  const water = at(STREAK.waterNudgeHour, STREAK.waterNudgeMinute, 0);
  if (water.getTime() > now && !waterDone) {
    const left = Math.max(0, state.profile.waterTargetMl - (sameDay ? getWaterConsumedMl(state) : 0));
    plan.push({ id: 'water', at: water, title: TITLE, body: `${pet} is thirsty. ${formatWater(left, state.profile.waterUnit)} to go.`, url: '/today/water' });
  } else {
    plan.push({ id: 'water', at: at(STREAK.waterNudgeHour, STREAK.waterNudgeMinute, 1), title: TITLE, body: `${pet} is thirsty. Time for the first glass of the day.`, url: '/today/water' });
  }

  // Streak warning, unless an evening reminder close to it already carries the line.
  const warn = at(STREAK.streakWarningHour, STREAK.streakWarningMinute, 0);
  const closeToEvening = Math.abs(evening.getTime() - warn.getTime()) < 90 * 60 * 1000;
  if (warn.getTime() > now && atRisk) {
    if (!(eveningToday && closeToEvening)) {
      plan.push({ id: 'streak', at: warn, title: TITLE, body: `Your ${streak.current}-day streak ends at midnight. One goal keeps it going.` });
    }
  } else if (aliveTomorrow > 0 && !closeToEvening) {
    plan.push({
      id: 'streak',
      at: at(STREAK.streakWarningHour, STREAK.streakWarningMinute, 1),
      title: TITLE,
      body: `Your ${aliveTomorrow}-day streak ends tonight unless you log one goal.`,
    });
  }
  return plan;
}

/** The first unfinished goal as the pet's need, matching the mood on the stage. */
function needLine(state: GameState, sameDay: boolean): string {
  const pet = state.profile.petName;
  if (!sameDay || !isWaterDone(state)) return `${pet} is thirsty. Log some water.`;
  if (!state.today.eatingDone) return `${pet} is hungry. Check in on eating well.`;
  if (!state.today.movementDone) return `${pet} feels lazy. Log some movement.`;
  return `${pet} is waiting for the bonus row.`;
}
