import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import { Platform } from 'react-native';

import { useGameState } from '@/state/GameProvider';

export type HapticKind = 'tap' | 'select' | 'success' | 'warning' | 'reward';

export function useHaptics() {
  const enabled = useGameState().prefs.haptics;
  return useCallback(
    (kind: HapticKind) => {
      if (!enabled || Platform.OS === 'web') return;
      const run = async () => {
        switch (kind) {
          case 'tap':
            return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          case 'select':
            return Haptics.selectionAsync();
          case 'success':
            return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          case 'warning':
            return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          case 'reward':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await new Promise((r) => setTimeout(r, 90));
            return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      };
      run().catch(() => undefined);
    },
    [enabled],
  );
}
