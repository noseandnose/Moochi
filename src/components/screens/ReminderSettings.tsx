import { Bell, Flame } from 'lucide-react-native';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Switch, View } from 'react-native';

import { useHaptics } from '@/hooks/useHaptics';
import { ensureNotificationPermission } from '@/services/notifications';
import { useGame } from '@/state/GameProvider';
import { Card, Field, Text, useToast } from '@/ui/components';
import { colors, radius, spacing } from '@/ui/theme';

const PRESETS: { label: string; hour: number; minute: number }[] = [
  { label: 'Morning · 8:00', hour: 8, minute: 0 },
  { label: 'Midday · 12:30', hour: 12, minute: 30 },
  { label: 'Evening · 7:30', hour: 19, minute: 30 },
];

function formatTime(hour: number, minute: number): string {
  const d = new Date(2000, 0, 1, hour, minute);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** Daily local reminder: on/off plus a time. No server involved. */
export function ReminderSettings() {
  const { state, dispatch } = useGame();
  const toast = useToast();
  const haptic = useHaptics();
  const { reminderEnabled, reminderHour, reminderMinute, nudgesEnabled } = state.prefs;
  const [custom, setCustom] = useState(`${String(reminderHour).padStart(2, '0')}:${String(reminderMinute).padStart(2, '0')}`);
  const [error, setError] = useState<string | null>(null);

  const toggle = async (value: boolean) => {
    if (value) {
      const ok = await ensureNotificationPermission();
      if (!ok) {
        toast(Platform.OS === 'web' ? 'Reminders need the phone app.' : 'Allow notifications to get a daily reminder.', 'danger');
        return;
      }
    }
    dispatch({ type: 'updatePrefs', patch: { reminderEnabled: value } });
    haptic('select');
  };

  const setTime = (hour: number, minute: number) => {
    dispatch({ type: 'updatePrefs', patch: { reminderHour: hour, reminderMinute: minute } });
    setCustom(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    setError(null);
    haptic('select');
  };

  const saveCustom = () => {
    const m = custom.trim().match(/^(\d{1,2}):(\d{2})$/);
    const hour = m ? Number(m[1]) : NaN;
    const minute = m ? Number(m[2]) : NaN;
    if (!m || hour > 23 || minute > 59) {
      setError('Use 24-hour time, like 07:45 or 21:00.');
      return;
    }
    setTime(hour, minute);
  };

  return (
    <Card style={{ gap: spacing.md }}>
      <View style={styles.row}>
        <View style={styles.icon}>
          <Bell size={20} color={colors.sageDeep} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">Daily reminder</Text>
          <Text variant="small" tone="muted">
            {reminderEnabled ? `At ${formatTime(reminderHour, reminderMinute)}, saying what ${state.profile.petName} still needs. Silent once all three are done.` : 'One notification a day, at a time you choose.'}
          </Text>
        </View>
        <Switch
          accessibilityLabel="Daily reminder"
          value={reminderEnabled}
          onValueChange={toggle}
          trackColor={{ true: colors.sage, false: colors.lineStrong }}
          thumbColor={colors.surface}
          ios_backgroundColor={colors.lineStrong}
        />
      </View>
      <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Reminder time">
        {PRESETS.map((p) => {
          const selected = p.hour === reminderHour && p.minute === reminderMinute;
          return (
            <Pressable
              key={p.label}
              accessibilityRole="radio"
              accessibilityState={{ selected, checked: selected }}
              accessibilityLabel={p.label}
              onPress={() => setTime(p.hour, p.minute)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text variant="smallStrong" tone={selected ? 'inverse' : 'soft'}>
                {p.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Field label="Custom time (24-hour)" value={custom} onChangeText={setCustom} onBlur={saveCustom} onSubmitEditing={saveCustom} keyboardType="numbers-and-punctuation" placeholder="19:30" error={error} returnKeyType="done" />
      <View style={[styles.row, { opacity: reminderEnabled ? 1 : 0.5 }]}>
        <View style={styles.icon}>
          <Flame size={20} color={colors.sageDeep} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">Nudges</Text>
          <Text variant="small" tone="muted">
            A water nudge at 1:00 PM while water is behind, and a streak warning at 8:30 PM while a streak is at risk. Nothing on days they do not apply.
          </Text>
        </View>
        <Switch
          accessibilityLabel="Nudges"
          value={reminderEnabled && nudgesEnabled}
          disabled={!reminderEnabled}
          onValueChange={(v) => {
            dispatch({ type: 'updatePrefs', patch: { nudgesEnabled: v } });
            haptic('select');
          }}
          trackColor={{ true: colors.sage, false: colors.lineStrong }}
          thumbColor={colors.surface}
          ios_backgroundColor={colors.lineStrong}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingHorizontal: 12, minHeight: 40, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  chipSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
});
