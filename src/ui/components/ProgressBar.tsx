import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useReduceMotion } from '@/hooks/useMotion';

import { colors } from '../theme';

export interface ProgressBarProps {
  /** 0..1 */
  value: number;
  color?: string;
  track?: string;
  height?: number;
  label: string;
}

export function ProgressBar({ value, color = colors.ink, track = colors.surfaceSunken, height = 10, label }: ProgressBarProps) {
  const reduce = useReduceMotion();
  const progress = useSharedValue(value);
  useEffect(() => {
    const clamped = Math.max(0, Math.min(1, value));
    progress.value = reduce ? clamped : withTiming(clamped, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [value, reduce, progress]);
  const fill = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(Math.max(0, Math.min(1, value)) * 100) }}
      style={[styles.track, { backgroundColor: track, height, borderRadius: height / 2 }]}
    >
      <Animated.View style={[styles.fill, { backgroundColor: color, borderRadius: height / 2 }, fill]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: { height: '100%' },
});
