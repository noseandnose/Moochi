import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, shadow, spacing } from '../theme';
import { Text } from './Text';

interface ToastItem {
  id: number;
  message: string;
  tone: 'ink' | 'danger';
}

const ToastContext = createContext<(message: string, tone?: 'ink' | 'danger') => void>(() => undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const show = useCallback((message: string, tone: 'ink' | 'danger' = 'ink') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: Date.now(), message, tone });
    timer.current = setTimeout(() => setToast(null), 2400);
  }, []);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const value = useMemo(() => show, [show]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <View pointerEvents="none" style={[styles.host, { bottom: insets.bottom + 92 }]}>
        {toast ? (
          <Animated.View
            key={toast.id}
            entering={FadeInDown.duration(220)}
            exiting={FadeOutDown.duration(180)}
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            style={[styles.toast, toast.tone === 'danger' && { backgroundColor: colors.danger }]}
          >
            <Text variant="smallStrong" tone="inverse" align="center">
              {toast.message}
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: spacing.screen },
  toast: {
    backgroundColor: colors.ink,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radius.pill,
    maxWidth: 420,
    ...shadow.raised,
  },
});
