import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import React from 'react';
import { Alert, Platform, StyleSheet, Switch, View } from 'react-native';

import { BackupSettings } from '@/components/screens/BackupSettings';
import { HealthSettings } from '@/components/screens/HealthSettings';
import { ReminderSettings } from '@/components/screens/ReminderSettings';
import { ProfileForm } from '@/components/screens/ProfileForm';
import { useBack } from '@/hooks/useBack';
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
  const back = useBack();

  const performReset = () => {
    // The root layout swaps to onboarding as soon as the state is no longer onboarded,
    // which unmounts this modal; dismissing it here too would fight that transition.
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
        <IconButton label="Close settings" onPress={back}>
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
            YOUchi started with defaults and kept a backup copy of the unreadable data on this device.
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
          }}
        />
      </Card>

      <SectionHeading title="Daily reminder" />
      <ReminderSettings />

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

      <SectionHeading title="Home screen widget" />
      <Card style={{ gap: spacing.sm }}>
        <Text variant="small" tone="soft">
          {state.profile.petName} on your home screen with today’s three goals. The fastest way back into a good day.
        </Text>
        <Button label="How to add the widget" variant="secondary" full onPress={() => router.push('/widget')} />
      </Card>

      <SectionHeading title="Backup" />
      <BackupSettings onRestored={back} />

      <SectionHeading title="Your data" />
      <Card tone="muted" elevated={false} style={{ gap: spacing.sm }}>
        <Text variant="small" tone="soft">
          YOUchi stores everything on this device only: your pet, goals, XP, coins, gear, water log, progress selfies and daily history. There is no account, no cloud sync and nothing leaves your phone. The home screen widget reads only your pet, level and today’s goal count.
        </Text>
        <Text variant="small" tone="soft">
          Deleting the app removes this data. Progress from the YOUchi website does not transfer automatically.
        </Text>
        <Text variant="small" tone="soft">
          Water targets are editable starting points, not medical advice.
        </Text>
        <Button label="Privacy policy" variant="secondary" size="sm" onPress={() => router.push('/privacy')} style={{ alignSelf: 'flex-start', marginTop: spacing.xs }} />
      </Card>

      <SectionHeading title="Danger zone" />
      <Card tone="muted" elevated={false} style={{ gap: spacing.sm }}>
        <Text variant="small" tone="soft">
          Removes your pet, XP, coins, gear, photos and history from this device. Export a backup first if you might want it back.
        </Text>
        <Button label="Reset all progress" variant="danger" full onPress={confirmReset} />
      </Card>
      <Text variant="small" tone="muted" align="center">
        YOUchi · Build habits. Level up.
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
