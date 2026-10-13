import { X } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

import { CoinIcon, SparkIcon } from '@/components/icons';
import { IconButton, Text } from '@/ui/components';
import { colors, radius, shadow, spacing } from '@/ui/theme';

export interface RewardBannerProps {
  title: string;
  xp: number;
  coins: number;
  onDismiss: () => void;
}

export function RewardBanner({ title, xp, coins, onDismiss }: RewardBannerProps) {
  return (
    <Animated.View entering={FadeInUp.duration(260)} exiting={FadeOutUp.duration(200)} accessibilityLiveRegion="polite" style={styles.banner}>
      <View style={styles.text}>
        <Text variant="bodyStrong" tone="inverse">
          {title}
        </Text>
        <View style={styles.rewards}>
          <View style={styles.reward}>
            <SparkIcon size={16} color="#F2DC8E" />
            <Text variant="smallStrong" tone="inverse">
              +{xp} XP
            </Text>
          </View>
          <View style={styles.reward}>
            <CoinIcon size={16} color="#F2DC8E" />
            <Text variant="smallStrong" tone="inverse">
              +{coins} {coins === 1 ? 'coin' : 'coins'}
            </Text>
          </View>
        </View>
      </View>
      <IconButton label="Dismiss reward message" tone="plain" onPress={onDismiss}>
        <X size={20} color={colors.surface} />
      </IconButton>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    ...shadow.raised,
  },
  text: { flex: 1, gap: 4 },
  rewards: { flexDirection: 'row', gap: spacing.md },
  reward: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
