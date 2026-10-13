import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useReduceMotion } from '@/hooks/useMotion';

import { colors } from '../theme';
import { Text } from './Text';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface RingProps {
  /** 0..1 */
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  label: string;
  caption?: string;
  children?: React.ReactNode;
}

export function Ring({ value, size = 64, stroke = 7, color = colors.ink, track = colors.surfaceSunken, label, caption, children }: RingProps) {
  const reduce = useReduceMotion();
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = useSharedValue(value);
  useEffect(() => {
    const v = Math.max(0, Math.min(1, value));
    progress.value = reduce ? v : withTiming(v, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [value, reduce, progress]);
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        {children ?? (
          <Text variant="smallStrong" align="center">
            {caption}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
});
