import { PATH_BY_ID, STAGES, getBonusCount, getCompletedCount, getGrowth, getStage, getVisualPath, type GameState } from '@/game';

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
}

export function buildWidgetSnapshot(state: GameState): WidgetSnapshot {
  const growth = getGrowth(state);
  const stage = getStage(state);
  return {
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
