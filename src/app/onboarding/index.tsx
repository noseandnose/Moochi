import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { GoalIcon } from '@/components/icons';
import { Button, Screen, Text } from '@/ui/components';
import { colors, radius, spacing } from '@/ui/theme';

const logo = require('../../../assets/brand/logo.png');
const trio = require('../../../assets/brand/trio.png');
const forest = require('../../../assets/scenes/foxi_sky.png');

export default function Welcome() {
  const router = useRouter();
  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.brand}>
        <Image source={logo} style={styles.logo} resizeMode="contain" accessibilityLabel="MOCHI" />
        <Text variant="small" tone="muted">
          Build habits. Level up.
        </Text>
      </View>
      <View style={styles.hero} accessible accessibilityLabel="Foxi, Lumi and Drako standing together">
        <Image source={forest} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={styles.ground} />
        <Image source={trio} style={styles.trio} resizeMode="contain" />
      </View>
      <Text variant="display" accessibilityRole="header">
        Build habits.{'\n'}Level up.
      </Text>
      <Text variant="body" tone="soft">
        Drink water, move, and eat well. Earn XP, evolve your pet, and unlock new gear.
      </Text>
      <View style={styles.steps}>
        {[
          { kind: 'water' as const, text: 'Three daily goals' },
          { kind: 'movement' as const, text: 'XP, coins and growth' },
          { kind: 'bonus' as const, text: 'Gear to unlock' },
        ].map((s) => (
          <View key={s.kind} style={styles.step}>
            <GoalIcon kind={s.kind} size={22} />
            <Text variant="bodyStrong">{s.text}</Text>
          </View>
        ))}
      </View>
      <View style={styles.spacer} />
      <Button label="Choose my pet" size="lg" full onPress={() => router.push('/onboarding/choose')} />
      <Text variant="small" tone="muted" align="center">
        Everything stays on this device. No account needed.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
  brand: { gap: 2, marginBottom: spacing.sm },
  logo: { width: 132, height: 28 },
  hero: {
    height: 190,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: colors.line,
  },
  ground: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 44, backgroundColor: '#cfd7c3' },
  trio: { width: 300, height: 150, marginBottom: 6 },
  steps: { gap: spacing.md, marginTop: spacing.sm },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  spacer: { flex: 1, minHeight: spacing.lg },
});
