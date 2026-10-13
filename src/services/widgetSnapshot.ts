import { PATH_BY_ID, STAGES, getBonusCount, getCompletedCount, getGrowth, getPetMood, getStage, getVisualPath, isWaterDone, moodLine, type GameState, type PetMood } from '@/game';

/** Everything a home screen widget needs, without any private habit data. */
export interface WidgetSnapshot {
  petName: string;
  stageName: string;
  pathName: string;
  completed: number;
  bonus: number;
  xp: number;
  level: number;
  xpToNext: number;
  nextStageName: string;
  coins: number;
  date: string;
  isEgg: boolean;
  mood: PetMood;
  /** One line telling the player what to do next. */
  statusLine: string;
  waterDone: boolean;
  movementDone: boolean;
  eatingDone: boolean;
}

export function buildWidgetSnapshot(state: GameState, now: number = Date.now()): WidgetSnapshot {
  const growth = getGrowth(state);
  const stage = getStage(state);
  const isEgg = stage === 'egg';
  const mood = getPetMood(state, now);
  return {
    mood,
    statusLine: isEgg ? 'Complete goals to hatch your pet.' : moodLine(mood, state.profile.petName),
    waterDone: isWaterDone(state),
    movementDone: state.today.movementDone,
    eatingDone: state.today.eatingDone,
    petName: state.profile.petName,
    stageName: STAGES.find((s) => s.id === stage)?.name ?? 'Egg',
    pathName: PATH_BY_ID[getVisualPath(state)].name,
    completed: getCompletedCount(state),
    bonus: getBonusCount(state),
    xp: state.progress.xp,
    level: growth.level,
    xpToNext: growth.xpToNext,
    nextStageName: growth.nextStageName ?? `level ${growth.level + 1}`,
    coins: state.progress.coins,
    date: state.today.date,
    isEgg: stage === 'egg',
  };
}
