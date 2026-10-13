import { Check, ChevronRight } from 'lucide-react-native';
import React, { useEffect } from 'react';
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
  /** Reward line shown while not done, e.g. "25 XP · 5 coins". */
  reward: string;
  actionLabel: string;
  onAction: () => void;
  onOpen: () => void;
  optional?: boolean;
}

export function GoalCard({ kind, title, detail, done, reward, actionLabel, onAction, onOpen, optional }: GoalCardProps) {
  const reduce = useReduceMotion();
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (done && !reduce) {
      pulse.value = withSequence(withTiming(1.02, { duration: 140, easing: Easing.out(Easing.quad) }), withTiming(1, { duration: 260, easing: Easing.out(Easing.back(2)) }));
    }
  }, [done, reduce, pulse]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  return (
    <Animated.View style={[styles.card, done && styles.cardDone, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}${optional ? ', optional challenge' : ''}. ${detail}. ${done ? 'Completed today.' : 'Not completed yet.'}`}
        accessibilityHint="Opens details"
        onPress={onOpen}
        style={({ pressed }) => [styles.body, pressed && { opacity: 0.8 }]}
      >
        <GoalTile kind={kind} done={done} size={52} />
        <View style={styles.text}>
          <View style={styles.titleRow}>
            <Text variant="subheading" numberOfLines={1} style={styles.title}>
              {title}
            </Text>
            {optional ? (
              <Text variant="caption" tone="muted">
                OPTIONAL
              </Text>
            ) : null}
          </View>
          <Text variant="small" tone="soft" numberOfLines={2}>
            {detail}
          </Text>
          {done ? (
            <View style={styles.doneRow}>
              <Check size={14} color={colors.success} strokeWidth={3} />
              <Text variant="smallStrong" tone="sage">
                Completed today
              </Text>
            </View>
          ) : (
            <Text variant="caption" tone="muted">
              {reward}
            </Text>
          )}
        </View>
        {done ? <ChevronRight size={20} color={colors.inkFaint} /> : null}
      </Pressable>
      {!done ? (
        <View style={styles.action}>
          <Button label={actionLabel} size="sm" variant={kind === 'water' ? 'secondary' : 'primary'} onPress={onAction} accessibilityLabel={`${actionLabel}: ${title}`} />
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadow.card,
  },
  cardDone: { backgroundColor: colors.surfaceMuted, borderColor: colors.surfaceMuted, shadowOpacity: 0, elevation: 0 },
  body: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  text: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flexShrink: 1 },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  action: { flexDirection: 'row', justifyContent: 'flex-end' },
});
