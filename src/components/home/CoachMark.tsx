import { X } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { IconButton, Text } from '@/ui/components';
import { colors, radius, spacing } from '@/ui/theme';

/** One-time orientation card shown on Today after onboarding. */
export function CoachMark({ petName, onDismiss }: { petName: string; onDismiss: () => void }) {
  return (
    <Animated.View entering={FadeIn.duration(260)} exiting={FadeOut.duration(180)} accessibilityRole="summary" style={styles.card}>
      <View style={styles.text}>
        <Text variant="bodyStrong">How a day works</Text>
        <Text variant="small" tone="soft">
          Three goals a day. Water opens a log; Move and Eat are one tap. Swipe the bonus row for extras. {petName} hatches at 100 XP and never loses progress on a missed day.
        </Text>
      </View>
      <IconButton label="Dismiss tips" tone="plain" onPress={onDismiss}>
        <X size={20} color={colors.inkSoft} />
      </IconButton>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.sageSoft,
    borderRadius: radius.lg,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
    paddingVertical: spacing.md,
  },
  text: { flex: 1, gap: 4 },
});
