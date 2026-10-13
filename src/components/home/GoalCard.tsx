import { Check, ChevronRight } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { GoalTile, type TileKind } from '@/components/icons';
import { useReduceMotion } from '@/hooks/useMotion';
import { Button, Text } from '@/ui/components';
import { colors, radius, shadow, spacing } from '@/ui/theme';

export interface GoalCardProps {
  kind: TileKind;
  title: string;
  detail: string;
  done: boolean;
  /** Short reward line, e.g. "25 XP · 5 coins". */
  reward: string;
  actionLabel: string;
  onAction: () => void;
  onOpen: () => void;
  optional?: boolean;
}

/** One compact row per goal: icon, title + detail, and the action inline. */
export function GoalCard({ kind, title, detail, done, reward, actionLabel, onAction, onOpen, optional }: GoalCardProps) {
  const reduce = useReduceMotion();
  const pulse = useSharedValue(1);
  // Pulse only when a card flips to done while on screen, not when a done card first mounts.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (done && !reduce) {
      pulse.value = withSequence(withTiming(1.02, { duration: 140, easing: Easing.out(Easing.quad) }), withTiming(1, { duration: 260, easing: Easing.out(Easing.back(2)) }));
    }
  }, [done, reduce, pulse]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  return (
    <Animated.View style={[styles.card, done && styles.cardDone, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}${optional ? ', optional challenge' : ''}. ${detail}. ${done ? 'Completed today.' : `Not completed yet. Reward ${reward}.`}`}
        accessibilityHint="Opens details"
        onPress={onOpen}
        style={({ pressed }) => [styles.body, pressed && { opacity: 0.8 }]}
      >
        <GoalTile kind={kind} done={done} size={40} />
        <View style={styles.text}>
          <View style={styles.titleRow}>
            <Text variant="bodyStrong" numberOfLines={1} style={styles.title}>
              {title}
            </Text>
            {optional ? (
              <Text variant="caption" tone="muted">
                OPTIONAL
              </Text>
            ) : null}
          </View>
          {done ? (
            <View style={styles.doneRow}>
              <Check size={13} color={colors.success} strokeWidth={3} />
              <Text variant="small" tone="sage" numberOfLines={1}>
                Completed today
              </Text>
            </View>
          ) : (
            <Text variant="small" tone="soft" numberOfLines={1}>
              {detail}
            </Text>
          )}
        </View>
      </Pressable>
      {done ? (
        // The whole row already opens details; a second tap right after Done must not navigate.
        <View style={styles.chevron} pointerEvents="none">
          <ChevronRight size={20} color={colors.inkFaint} />
        </View>
      ) : (
        <Button label={actionLabel} size="sm" variant={kind === 'water' ? 'secondary' : 'primary'} onPress={onAction} accessibilityLabel={`${actionLabel}: ${title}`} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 10,
    minHeight: 62,
    ...shadow.card,
  },
  cardDone: { backgroundColor: colors.surfaceMuted, borderColor: colors.surfaceMuted, shadowOpacity: 0, elevation: 0 },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  text: { flex: 1, gap: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { flexShrink: 1 },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chevron: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
