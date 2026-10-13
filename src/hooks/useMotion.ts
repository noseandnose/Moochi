import { useReducedMotion } from 'react-native-reanimated';

import { useGameState } from '@/state/GameProvider';

/** True when animation should be minimal: system Reduce Motion or the in-app toggle. */
export function useReduceMotion(): boolean {
  const system = useReducedMotion();
  const pref = useGameState().prefs.reduceMotion;
  return system || pref;
}
