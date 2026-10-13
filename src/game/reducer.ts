import { DEFAULTS, GEAR_BY_ID, PET_BY_ID, REWARDS } from './constants';
import { dateKey } from './date';
import {
  getCompletedCount,
  getDailyRecord,
  getStage,
  isGoalDone,
  isWaterDone,
} from './selectors';
import { createInitialState, emptyDay } from './state';
import type {
  BonusId,
  ErrorCode,
  GameAction,
  GameEvent,
  GameResult,
  GameState,
  GoalId,
  MovementSource,
  OnboardingInput,
  RewardKey,
} from './types';

/**
 * The single entry point for changing game state. Pure: same input, same
 * output. Every action that touches daily data first rolls the day over if
 * the local calendar date has changed.
 */
export function reduce(state: GameState, action: GameAction): GameResult {
  switch (action.type) {
    case 'sync':
      return syncDay(state, action.now);
    case 'completeOnboarding':
      return completeOnboarding(state, action.input, action.now);
    case 'addWater':
      return addWater(state, action.ml, action.now);
    case 'undoWater':
      return undoWater(state, action.now);
    case 'setCheckIn':
      return setCheckIn(state, action.goal, action.done, action.now);
    case 'recordSelfie':
      return recordSelfie(state, action.file, action.now);
    case 'removeSelfie':
      return removeSelfie(state, action.date, action.now);
    case 'recordActivity':
      return recordActivity(state, action.steps, action.workoutMinutes, action.now);
    case 'selectPet':
      return ok({ ...state, profile: { ...state.profile, petId: action.petId } });
    case 'renamePet':
      return renamePet(state, action.name);
    case 'updateProfile':
      return updateProfile(state, action.patch, action.now);
    case 'setWaterUnit':
      return ok({ ...state, profile: { ...state.profile, waterUnit: action.unit } });
    case 'updatePrefs':
      return ok({ ...state, prefs: { ...state.prefs, ...action.patch } });
    case 'buyGear':
      return buyGear(state, action.gear);
    case 'equipGear':
      return equipGear(state, action.gear);
    case 'reset':
      return ok(createInitialState());
    case 'restore':
      return syncDay(action.state, action.now);
  }
}

function ok(state: GameState, events: GameEvent[] = []): GameResult {
  return { state, events };
}

function fail(state: GameState, code: ErrorCode, message: string): GameResult {
  return { state, events: [{ type: 'error', code, message }] };
}

/* ------------------------------ rollover ----------------------------- */

/**
 * Moves `today` to the current local date. The outgoing day's record is
 * already in `history` (it is written on every change), so rollover only
 * resets daily tracking. XP, coins, gear, ledger and history are untouched.
 */
export function syncDay(state: GameState, now: number): GameResult {
  const today = dateKey(now);
  if (state.today.date === today) return ok(state);
  const events: GameEvent[] = [];
  let history = state.history;
  if (state.today.date && state.createdOn) {
    history = { ...history, [state.today.date]: getDailyRecord(state) };
    events.push({ type: 'dayRolled', from: state.today.date, to: today });
  }
  return ok({ ...state, history, today: emptyDay(today) }, events);
}

/* ----------------------------- onboarding ---------------------------- */

function completeOnboarding(state: GameState, input: OnboardingInput, now: number): GameResult {
  const validation = validateProfile(input);
  if (validation) return validation(state);
  const synced = syncDay(state, now).state;
  const today = dateKey(now);
  return ok({
    ...synced,
    createdOn: synced.createdOn ?? today,
    profile: {
      ...synced.profile,
      petId: input.petId,
      petName: cleanName(input.petName, PET_BY_ID[input.petId].name),
      gender: input.gender,
      waterUnit: input.waterUnit,
      waterTargetMl: input.waterTargetMl,
      movementMinutes: Math.round(input.movementMinutes),
      eatingGoal: cleanText(input.eatingGoal, DEFAULTS.eatingGoal, DEFAULTS.maxEatingGoalLength),
    },
    today: synced.today.date === today ? synced.today : emptyDay(today),
  });
}

function validateProfile(input: Partial<OnboardingInput>): ((s: GameState) => GameResult) | null {
  if (
    input.waterTargetMl !== undefined &&
    (!Number.isFinite(input.waterTargetMl) ||
      input.waterTargetMl < DEFAULTS.minWaterTargetMl ||
      input.waterTargetMl > DEFAULTS.maxWaterTargetMl)
  ) {
    return (s) => fail(s, 'invalidTarget', 'Enter a water target greater than zero.');
  }
  if (
    input.movementMinutes !== undefined &&
    (!Number.isFinite(input.movementMinutes) ||
      input.movementMinutes < DEFAULTS.minMovementMinutes ||
      input.movementMinutes > DEFAULTS.maxMovementMinutes)
  ) {
    return (s) =>
      fail(
        s,
        'invalidMinutes',
        `Enter a movement goal from ${DEFAULTS.minMovementMinutes} to ${DEFAULTS.maxMovementMinutes} minutes.`,
      );
  }
  const steps = (input as Partial<GameState['profile']>).stepTarget;
  if (steps !== undefined && (!Number.isFinite(steps) || steps < DEFAULTS.minStepTarget || steps > DEFAULTS.maxStepTarget)) {
    return (s) =>
      fail(s, 'invalidSteps', `Enter a step target from ${DEFAULTS.minStepTarget.toLocaleString()} to ${DEFAULTS.maxStepTarget.toLocaleString()}.`);
  }
  return null;
}

function cleanName(name: string, fallback: string): string {
  const trimmed = (name ?? '').trim().slice(0, DEFAULTS.maxPetNameLength);
  return trimmed.length ? trimmed : fallback;
}

function cleanText(text: string, fallback: string, max: number): string {
  const trimmed = (text ?? '').trim().slice(0, max);
  return trimmed.length ? trimmed : fallback;
}

function renamePet(state: GameState, name: string): GameResult {
  const trimmed = (name ?? '').trim();
  if (!trimmed.length) return fail(state, 'invalidName', 'Give your pet a name.');
  return ok({ ...state, profile: { ...state.profile, petName: trimmed.slice(0, DEFAULTS.maxPetNameLength) } });
}

function updateProfile(state: GameState, patch: Partial<Omit<GameState['profile'], 'petId'>>, now: number): GameResult {
  const validation = validateProfile(patch);
  if (validation) return validation(state);
  const { state: synced, events } = syncDay(state, now);
  const profile = { ...synced.profile, ...patch };
  if (patch.petName !== undefined) profile.petName = cleanName(patch.petName, PET_BY_ID[profile.petId].name);
  if (patch.eatingGoal !== undefined) {
    profile.eatingGoal = cleanText(patch.eatingGoal, DEFAULTS.eatingGoal, DEFAULTS.maxEatingGoalLength);
  }
  if (patch.movementMinutes !== undefined) profile.movementMinutes = Math.round(patch.movementMinutes);
  if (patch.customGoal !== undefined) profile.customGoal = patch.customGoal.trim().slice(0, DEFAULTS.maxCustomGoalLength);
  if (patch.stepTarget !== undefined) profile.stepTarget = Math.round(patch.stepTarget);
  let next: GameState = { ...synced, profile };
  // Clearing the custom goal clears today's check-in for it (the reward, if earned, stays).
  if (!profile.customGoal && next.today.customDone) next = { ...next, today: { ...next.today, customDone: false } };
  // Lowering the water target or step target can complete goals; evaluate rewards.
  const result = evaluate(next, events, 'water', isWaterDone(synced));
  return applyActivity(result.state, result.events, now);
}

/* ------------------------------- water ------------------------------- */

function addWater(state: GameState, ml: number, now: number): GameResult {
  if (!Number.isFinite(ml) || ml <= 0) {
    return fail(state, 'invalidAmount', 'Enter an amount greater than zero.');
  }
  if (ml > DEFAULTS.maxSingleEntryMl) {
    return fail(state, 'amountTooLarge', 'That is a lot of water for one drink. Try a smaller amount.');
  }
  const { state: synced, events } = syncDay(state, now);
  const wasDone = isWaterDone(synced);
  const next: GameState = {
    ...synced,
    today: { ...synced.today, waterEntries: [...synced.today.waterEntries, { ml, at: now }] },
  };
  return evaluate(next, [...events, { type: 'waterAdded', ml }], 'water', wasDone);
}

function undoWater(state: GameState, now: number): GameResult {
  const { state: synced, events: syncEvents } = syncDay(state, now);
  const entries = synced.today.waterEntries;
  if (!entries.length) return fail(synced, 'nothingToUndo', 'Nothing to undo yet.');
  const wasDone = isWaterDone(synced);
  const removed = entries[entries.length - 1];
  const next: GameState = {
    ...synced,
    today: { ...synced.today, waterEntries: entries.slice(0, -1) },
  };
  const events: GameEvent[] = [...syncEvents, { type: 'waterUndone', ml: removed.ml }];
  if (wasDone && !isWaterDone(next)) events.push({ type: 'goalUndone', goal: 'water' });
  return ok(writeHistory(next), events);
}

/* ------------------------------ check-ins ---------------------------- */

function setCheckIn(state: GameState, goal: 'movement' | 'eating' | 'bonus' | 'custom', done: boolean, now: number): GameResult {
  const { state: synced, events } = syncDay(state, now);
  if (goal === 'custom' && done && !synced.profile.customGoal) {
    return fail(synced, 'noCustomGoal', 'Set a custom goal first.');
  }
  const key = goal === 'movement' ? 'movementDone' : goal === 'eating' ? 'eatingDone' : goal === 'bonus' ? 'bonusDone' : 'customDone';
  if (synced.today[key] === done) return ok(synced, events);
  const today = { ...synced.today, [key]: done };
  if (goal === 'movement') today.movementSource = done ? 'manual' : null;
  const next: GameState = { ...synced, today };
  if (!done) return ok(writeHistory(next), [...events, { type: 'goalUndone', goal }]);
  return evaluate(next, events, goal, false);
}

/* ------------------------------- selfies ----------------------------- */

function recordSelfie(state: GameState, file: string, now: number): GameResult {
  const { state: synced, events } = syncDay(state, now);
  const name = (file ?? '').trim();
  if (!name) return fail(synced, 'invalidName', 'Could not save the photo.');
  const date = synced.today.date;
  const selfies = [...synced.selfies.filter((s) => s.date !== date), { date, file: name, at: now }].sort((a, b) => a.date.localeCompare(b.date));
  const wasDone = synced.today.selfieDone;
  const next: GameState = { ...synced, selfies, today: { ...synced.today, selfieDone: true } };
  return evaluate(next, events, 'selfie', wasDone);
}

function removeSelfie(state: GameState, date: string, now: number): GameResult {
  const { state: synced, events } = syncDay(state, now);
  const selfies = synced.selfies.filter((s) => s.date !== date);
  if (selfies.length === synced.selfies.length) return ok(synced, events);
  const today = date === synced.today.date ? { ...synced.today, selfieDone: false } : synced.today;
  const next: GameState = { ...synced, selfies, today };
  const out: GameEvent[] = [...events];
  if (date === synced.today.date && synced.today.selfieDone) out.push({ type: 'goalUndone', goal: 'selfie' });
  return ok(writeHistory(next), out);
}

/* ------------------------------- health ------------------------------ */

/**
 * Stores today's steps and workout minutes from the health platform and
 * completes the movement goal when either reaches its target. A goal the
 * user completed by hand is never downgraded.
 */
function recordActivity(state: GameState, steps: number, workoutMinutes: number, now: number): GameResult {
  const { state: synced, events } = syncDay(state, now);
  const activity = {
    steps: Math.max(0, Math.floor(Number.isFinite(steps) ? steps : 0)),
    workoutMinutes: Math.max(0, Math.floor(Number.isFinite(workoutMinutes) ? workoutMinutes : 0)),
    syncedAt: now,
  };
  const next: GameState = { ...synced, today: { ...synced.today, activity } };
  return applyActivity(next, events, now);
}

function applyActivity(state: GameState, events: GameEvent[], _now: number): GameResult {
  if (!state.profile.healthEnabled || !state.today.activity || state.today.movementDone) return ok(state, events);
  const a = state.today.activity;
  const reached = a.workoutMinutes >= state.profile.movementMinutes || a.steps >= state.profile.stepTarget;
  if (!reached) return ok(state, events);
  const next: GameState = { ...state, today: { ...state.today, movementDone: true, movementSource: 'health' } };
  return evaluate(next, events, 'movement', false, 'health');
}

/* ------------------------------- rewards ----------------------------- */

/**
 * Awards every reward whose condition holds and that has not yet been
 * claimed today. The ledger is the only source of truth for "claimed", so
 * repeated taps, undo/redo and restarts can never award twice.
 */
function evaluate(
  state: GameState,
  events: GameEvent[],
  trigger: GoalId | BonusId,
  wasDoneBefore: boolean,
  source?: MovementSource,
): GameResult {
  const date = state.today.date;
  const stageBefore = getStage(state);
  const dayLedger = { ...(state.ledger[date] ?? {}) };
  let { xp, coins } = state.progress;
  const habitCounts = { ...state.progress.habitCounts };
  const out = [...events];

  const claim = (key: RewardKey, reward: { xp: number; coins: number }) => {
    if (dayLedger[key]) return;
    dayLedger[key] = true;
    xp += reward.xp;
    coins += reward.coins;
    if (key === 'water' || key === 'movement' || key === 'eating') habitCounts[key] += 1;
    out.push({ type: 'reward', source: key, xp: reward.xp, coins: reward.coins });
  };

  const nowDone = isGoalDone(state, trigger);
  if (nowDone && !wasDoneBefore) out.push(source ? { type: 'goalCompleted', goal: trigger, source } : { type: 'goalCompleted', goal: trigger });

  if (isWaterDone(state)) claim('water', REWARDS.goal);
  if (state.today.movementDone) claim('movement', REWARDS.goal);
  if (state.today.eatingDone) claim('eating', REWARDS.goal);
  if (state.today.bonusDone) claim('bonus', REWARDS.bonus);
  if (state.today.selfieDone) claim('selfie', REWARDS.bonus);
  if (state.today.customDone) claim('custom', REWARDS.bonus);
  if (getCompletedCount(state) === 3) {
    const before = !!dayLedger.allThree;
    claim('allThree', REWARDS.allThree);
    if (!before && dayLedger.allThree) out.push({ type: 'allGoalsCompleted' });
  }

  const next: GameState = {
    ...state,
    progress: { ...state.progress, xp, coins, habitCounts },
    ledger: { ...state.ledger, [date]: dayLedger },
  };
  const stageAfter = getStage(next);
  if (stageAfter !== stageBefore) out.push({ type: 'stageChanged', from: stageBefore, to: stageAfter });
  return ok(writeHistory(next), out);
}

function writeHistory(state: GameState): GameState {
  if (!state.createdOn || !state.today.date) return state;
  return { ...state, history: { ...state.history, [state.today.date]: getDailyRecord(state) } };
}

/* -------------------------------- gear ------------------------------- */

function buyGear(state: GameState, gear: GameState['progress']['equippedGear']): GameResult {
  const item = GEAR_BY_ID[gear];
  if (!item) return fail(state, 'notOwned', 'Unknown gear.');
  if (state.progress.ownedGear.includes(gear)) return equipGear(state, gear);
  if (state.progress.coins < item.cost) {
    const short = item.cost - state.progress.coins;
    return fail(state, 'insufficientCoins', `${short} more ${short === 1 ? 'coin' : 'coins'} to unlock ${item.name}.`);
  }
  const progress = {
    ...state.progress,
    coins: state.progress.coins - item.cost,
    ownedGear: [...state.progress.ownedGear, gear],
    equippedGear: gear,
  };
  return ok({ ...state, progress }, [
    { type: 'purchase', gear, cost: item.cost },
    { type: 'equipped', gear },
  ]);
}

function equipGear(state: GameState, gear: GameState['progress']['equippedGear']): GameResult {
  if (!state.progress.ownedGear.includes(gear)) {
    return fail(state, 'notOwned', 'Unlock this gear first.');
  }
  if (state.progress.equippedGear === gear) return ok(state);
  return ok({ ...state, progress: { ...state.progress, equippedGear: gear } }, [{ type: 'equipped', gear }]);
}
