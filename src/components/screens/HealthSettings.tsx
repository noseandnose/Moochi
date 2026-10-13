import { ExternalLink, Footprints } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Linking, Platform, StyleSheet, Switch, View } from 'react-native';

import { DEFAULTS } from '@/game';
import { useHaptics } from '@/hooks/useHaptics';
import { now } from '@/hooks/useNow';
import { getHealthStatus, healthProviderName, readTodayActivity, requestHealthAccess, type HealthStatus } from '@/services/health';
import { useCelebration } from '@/state/CelebrationProvider';
import { useGame } from '@/state/GameProvider';
import { Button, Card, Field, Text, useToast } from '@/ui/components';
import { colors, spacing } from '@/ui/theme';

/** Connect Apple Health / Health Connect and set the step target. */
export function HealthSettings() {
  const { state, dispatch } = useGame();
  const { queue } = useCelebration();
  const toast = useToast();
  const haptic = useHaptics();
  const [status, setStatus] = useState<HealthStatus | 'checking'>('checking');
  const [busy, setBusy] = useState(false);
  const [stepsText, setStepsText] = useState(String(state.profile.stepTarget));
  const [stepsError, setStepsError] = useState<string | null>(null);
  const enabled = state.profile.healthEnabled;
  const activity = state.today.activity;

  useEffect(() => {
    let active = true;
    getHealthStatus().then((s) => active && setStatus(s));
    return () => {
      active = false;
    };
  }, []);

  const toggle = async (value: boolean) => {
    if (!value) {
      dispatch({ type: 'updateProfile', patch: { healthEnabled: false }, now: now() });
      haptic('select');
      return;
    }
    setBusy(true);
    try {
      const granted = await requestHealthAccess();
      if (!granted) {
        toast(`${healthProviderName} access was not granted.`, 'danger');
        return;
      }
      dispatch({ type: 'updateProfile', patch: { healthEnabled: true }, now: now() });
      const read = await readTodayActivity(now());
      if (read) {
        const events = dispatch({ type: 'recordActivity', steps: read.steps, workoutMinutes: read.workoutMinutes, now: now() });
        if (events.some((e) => e.type === 'goalCompleted')) queue(events);
      }
      haptic('success');
      // HealthKit never reports a read denial, so say where to look if nothing comes through.
      toast(read && read.steps === 0 && read.workoutMinutes === 0 && Platform.OS === 'ios' ? 'Connected. If steps stay at 0, check Health → Sharing → Apps → YOUchi.' : `${healthProviderName} connected.`);
    } finally {
      setBusy(false);
    }
  };

  const saveSteps = () => {
    const n = Number(stepsText.replace(/[^\d]/g, ''));
    if (!Number.isFinite(n) || n < DEFAULTS.minStepTarget || n > DEFAULTS.maxStepTarget) {
      setStepsError(`Choose between ${DEFAULTS.minStepTarget.toLocaleString()} and ${DEFAULTS.maxStepTarget.toLocaleString()} steps.`);
      return;
    }
    setStepsError(null);
    if (n === state.profile.stepTarget) return; // tapping away without a change is not a save
    const events = dispatch({ type: 'updateProfile', patch: { stepTarget: n }, now: now() });
    if (events.some((e) => e.type === 'goalCompleted')) queue(events);
    haptic('success');
    toast('Step target saved.');
  };

  const unavailable = status === 'unavailable';
  return (
    <Card style={{ gap: spacing.md }}>
      <View style={styles.row}>
        <View style={styles.icon}>
          <Footprints size={20} color={colors.move} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">Sync with {healthProviderName}</Text>
          <Text variant="small" tone="muted">
            {status === 'checking'
              ? 'Checking availability…'
              : unavailable
                ? Platform.OS === 'web'
                  ? 'Not available in the browser preview.'
                  : `Needs a build with ${healthProviderName} included (not Expo Go).`
                : status === 'needsInstall'
                  ? 'Install or update Health Connect to continue.'
                  : 'Reads today’s steps and workout minutes. Movement completes itself when a target is met.'}
          </Text>
        </View>
        <Switch
          accessibilityLabel={`Sync with ${healthProviderName}`}
          value={enabled}
          disabled={busy || status === 'checking' || unavailable}
          onValueChange={toggle}
          trackColor={{ true: colors.sage, false: colors.lineStrong }}
          thumbColor={colors.surface}
          ios_backgroundColor={colors.lineStrong}
        />
      </View>
      {status === 'needsInstall' && Platform.OS === 'android' ? (
        <Button label="Get Health Connect" variant="secondary" size="sm" icon={<ExternalLink size={16} color={colors.ink} />} onPress={() => Linking.openURL('market://details?id=com.google.android.apps.healthdata').catch(() => undefined)} />
      ) : null}
      <Field label="Step target" value={stepsText} onChangeText={setStepsText} onBlur={saveSteps} keyboardType="number-pad" inputMode="numeric" suffix="steps" error={stepsError} hint={`Counts as movement on its own. Workouts of ${state.profile.movementMinutes}+ minutes also count.`} />
      {enabled ? (
        <Text variant="small" tone="soft">
          {activity ? `Today so far: ${activity.steps.toLocaleString()} steps · ${activity.workoutMinutes} min of workouts.` : 'No activity read yet today. It refreshes when you open the app.'}
        </Text>
      ) : null}
      <Text variant="small" tone="muted">
        Health data is read on this device only. Nothing is uploaded or shared.
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.moveSoft, alignItems: 'center', justifyContent: 'center' },
});
