import * as StoreReview from 'expo-store-review';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { STAGE_INDEX } from '@/game';

import { useGame } from './GameProvider';

/**
 * Asks for a store review once, a few seconds after the first evolution past
 * hatching (teen stage). The system decides whether to actually show it.
 */
export function ReviewPrompt() {
  const { state, ready, subscribe, dispatch } = useGame();
  useEffect(() => {
    if (!ready || Platform.OS === 'web') return;
    return subscribe((events, next) => {
      if (next.prefs.reviewRequested) return;
      const evolved = events.some((e) => e.type === 'stageChanged' && STAGE_INDEX[e.to] >= STAGE_INDEX.teen);
      if (!evolved) return;
      dispatch({ type: 'updatePrefs', patch: { reviewRequested: true } });
      setTimeout(async () => {
        try {
          if (await StoreReview.isAvailableAsync()) await StoreReview.requestReview();
        } catch {
          // The prompt is best effort.
        }
      }, 4000);
    });
  }, [ready, subscribe, dispatch, state.prefs.reviewRequested]);
  return null;
}
