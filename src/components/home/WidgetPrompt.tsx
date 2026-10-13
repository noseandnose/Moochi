import { LayoutGrid } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Button, Text } from '@/ui/components';
import { colors, radius, spacing } from '@/ui/theme';

interface Props {
  petName: string;
  /** Android: the launcher can place the widget directly. */
  direct: boolean;
  onAdd: () => void;
  onDismiss: () => void;
}

/** One-time card after hatching: invites the player to put the pet on the home screen. */
export function WidgetPrompt({ petName, direct, onAdd, onDismiss }: Props) {
  return (
    <Animated.View entering={FadeIn.duration(260)} exiting={FadeOut.duration(180)} accessibilityRole="summary" style={styles.card}>
      <View style={styles.row}>
        <View style={styles.icon}>
          <LayoutGrid size={20} color={colors.sageDeep} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">Put {petName} on your home screen</Text>
          <Text variant="small" tone="soft">
            The widget shows {petName}’s mood and today’s three goals, so you know what to do without opening the app.
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Button label="Not now" variant="secondary" size="sm" onPress={onDismiss} />
        <Button label={direct ? 'Add widget' : 'Show me how'} size="sm" onPress={onAdd} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md, backgroundColor: colors.sageSoft, borderRadius: radius.lg, padding: spacing.md, paddingLeft: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  icon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
});
