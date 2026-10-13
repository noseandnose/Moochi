import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import React from 'react';
import { Alert, Platform, StyleSheet, Switch, View } from 'react-native';

import { HealthSettings } from '@/components/screens/HealthSettings';
import { ProfileForm } from '@/components/screens/ProfileForm';
import { useHaptics } from '@/hooks/useHaptics';
import { now } from '@/hooks/useNow';
import { useGame } from '@/state/GameProvider';
import { Button, Card, IconButton, Screen, SectionHeading, Text, useToast } from '@/ui/components';
import { colors, spacing } from '@/ui/theme';

export default function Settings() {
  const router = useRouter();
  const { state, dispatch, recoveredFromCorruptData } = useGame();
  const toast = useToast();
  const haptic = useHaptics();

  const performReset = () => {
    // Leave the modal first; the root layout then swaps to onboarding because
    // the state is no longer onboarded.
    if (router.canDismiss()) router.dismissAll();
    dispatch({ type: 'reset' });
    haptic('warning');
  };

  const confirmReset = () => {
    if (Platform.OS === 'web') {
      // React Native Web has no Alert; use the browser's confirm dialog.
      if (globalThis.confirm?.('Reset your pet, coins, and all progress on this device? This cannot be undone.')) performReset();
      return;
    }
    Alert.alert(
      'Reset everything?',
      'This removes your pet, XP, coins, gear and history from this device. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: performReset },
      ],
    );
  };

  return (
    <Screen
      title="Settings"
      subtitle="Your goals, your pace."
      keyboard
      headerRight={
        <IconButton label="Close settings" onPress={() => router.back()}>
          <X size={22} color={colors.ink} />
        </IconButton>
      }
    >
      {recoveredFromCorruptData ? (
        <Card tone="muted" elevated={false}>
          <Text variant="smallStrong" tone="danger">
            Saved data could not be read
          </Text>
          <Text variant="small" tone="soft">
            MOCHI started with defaults and kept a backup copy of the unreadable data on this device.
          </Text>
        </Card>
      ) : null}
      <Card>
        <ProfileForm
          initial={{
            petName: state.profile.petName,
            gender: state.profile.gender,
            waterUnit: state.profile.waterUnit,
            waterTargetMl: state.profile.waterTargetMl,
            movementMinutes: state.profile.movementMinutes,
            eatingGoal: state.profile.eatingGoal,
            customGoal: state.profile.customGoal,
          }}
          submitLabel="Save goals"
          showCustomGoal
          compact
          onSubmit={(values) => {
            const events = dispatch({ type: 'updateProfile', patch: values, now: now() });
            const error = events.find((e) => e.type === 'error');
            if (error?.type === 'error') {
              toast(error.message, 'danger');
              return;
            }
            haptic('success');
            toast('Your goals are saved.');
            router.back();
          }}
        />
      </Card>

      <SectionHeading title="Steps and workouts" />
      <HealthSettings />

      <SectionHeading title="Motion and feedback" />
      <Card style={{ gap: spacing.md }}>
        <ToggleRow
          label="Reduce motion"
          hint="Keeps the pet still and shortens celebrations. Your system Reduce Motion setting is always respected."
          value={state.prefs.reduceMotion}
          onChange={(v) => dispatch({ type: 'updatePrefs', patch: { reduceMotion: v } })}
        />
        <ToggleRow label="Haptic feedback" hint="Subtle taps on completions and rewards." value={state.prefs.haptics} onChange={(v) => dispatch({ type: 'updatePrefs', patch: { haptics: v } })} />
      </Card>

      <SectionHeading title="Your data" />
      <Card tone="muted" elevated={false} style={{ gap: spacing.sm }}>
        <Text variant="small" tone="soft">
          MOCHI stores everything on this device only: your pet, goals, XP, coins, gear, water log, progress selfies and daily history. There is no account, no cloud sync and nothing leaves your phone. The home screen widget reads only your pet, level and today’s goal count.
        </Text>
        <Text variant="small" tone="soft">
          Deleting the app removes this data. Progress from the MOCHI website does not transfer automatically.
        </Text>
        <Text variant="small" tone="soft">
          Water targets are editable starting points, not medical advice.
        </Text>
      </Card>
      <Button label="Reset all progress" variant="danger" full onPress={confirmReset} />
      <Text variant="small" tone="muted" align="center">
        MOCHI · Build habits. Level up.
      </Text>
    </Screen>
  );
}

function ToggleRow({ label, hint, value, onChange }: { label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggle}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong">{label}</Text>
        <Text variant="small" tone="muted">
          {hint}
        </Text>
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.sage, false: colors.lineStrong }}
        thumbColor={colors.surface}
        ios_backgroundColor={colors.lineStrong}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
