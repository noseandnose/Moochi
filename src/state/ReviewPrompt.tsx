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
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = subscribe((events, next) => {
      if (next.prefs.reviewRequested) return;
      const evolved = events.some((e) => e.type === 'stageChanged' && STAGE_INDEX[e.to] >= STAGE_INDEX.teen);
      if (!evolved) return;
      // Not inside the listener loop of the dispatch that produced the event.
      setTimeout(() => dispatch({ type: 'updatePrefs', patch: { reviewRequested: true } }), 0);
      timer = setTimeout(async () => {
        try {
          if (await StoreReview.isAvailableAsync()) await StoreReview.requestReview();
        } catch {
          // The prompt is best effort.
        }
      }, 4000);
    });
    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [ready, subscribe, dispatch, state.prefs.reviewRequested]);
  return null;
}
