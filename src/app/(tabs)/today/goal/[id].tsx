import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Footprints, Undo2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { GoalTile, type TileKind } from '@/components/icons';
import { DEFAULTS, getDailyChallenge } from '@/game';
import { useHaptics } from '@/hooks/useHaptics';
import { now, useTodayKey } from '@/hooks/useNow';
import { useCelebration } from '@/state/CelebrationProvider';
import { useGame } from '@/state/GameProvider';
import { Button, Card, Field, Screen, Text, useToast } from '@/ui/components';
import { colors, spacing } from '@/ui/theme';

type CheckIn = 'movement' | 'eating' | 'bonus' | 'custom';

export default function GoalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const goal: CheckIn = id === 'eating' || id === 'bonus' || id === 'custom' ? id : 'movement';
  const router = useRouter();
  const { state, dispatch } = useGame();
  const { queue } = useCelebration();
  const toast = useToast();
  const haptic = useHaptics();
  const todayKey = useTodayKey();
  const [goalDraft, setGoalDraft] = useState(state.profile.customGoal);
  const [editing, setEditing] = useState(!state.profile.customGoal);

  const done = { movement: state.today.movementDone, eating: state.today.eatingDone, bonus: state.today.bonusDone, custom: state.today.customDone }[goal];
  const activity = state.today.activity;
  const copy = {
    movement: {
      title: 'Move your body',
      goalText: `${state.profile.movementMinutes} minutes of movement`,
      help: state.profile.healthEnabled
        ? `Logged automatically when ${state.profile.movementMinutes} workout minutes or ${state.profile.stepTarget.toLocaleString()} steps show up in your health app. You can always mark it by hand.`
        : 'A walk, a workout, stretching, or any movement you enjoy. Log it once you have done it.',
      reward: '25 XP · 5 coins',
    },
    eating: { title: 'Eat well', goalText: state.profile.eatingGoal, help: 'Your own eating goal, in your own words. One honest check-in a day.', reward: '25 XP · 5 coins' },
    bonus: { title: 'Daily challenge', goalText: getDailyChallenge(state.today.date || todayKey), help: 'An optional extra that changes every day. Skip it freely; it never counts against you.', reward: '20 XP · 4 coins' },
    custom: {
      title: 'Your goal',
      goalText: state.profile.customGoal || 'Set a goal in your own words',
      help: 'Anything you want to do daily: read ten pages, call someone, no screens after ten. Short and concrete works best.',
      reward: '20 XP · 4 coins',
    },
  }[goal];
  const kind: TileKind = goal === 'custom' ? 'bonus' : goal;
  const claimed = !!state.ledger[state.today.date]?.[goal];

  const complete = () => {
    const events = dispatch({ type: 'setCheckIn', goal, done: true, now: now() });
    const error = events.find((e) => e.type === 'error');
    if (error?.type === 'error') {
      toast(error.message, 'danger');
      return;
    }
    queue(events);
    haptic('success');
    router.back();
  };

  const undo = () => {
    dispatch({ type: 'setCheckIn', goal, done: false, now: now() });
    haptic('select');
    toast(claimed ? 'Check-in undone. Rewards already earned today stay with you.' : 'Check-in undone.');
    router.back();
  };

  const saveGoal = () => {
    const events = dispatch({ type: 'updateProfile', patch: { customGoal: goalDraft }, now: now() });
    const error = events.find((e) => e.type === 'error');
    if (error?.type === 'error') {
      toast(error.message, 'danger');
      return;
    }
    haptic('success');
    toast(goalDraft.trim() ? 'Goal saved.' : 'Goal cleared.');
    setEditing(false);
  };

  return (
    <Screen title={copy.title} subtitle={done ? 'Completed today' : goal === 'custom' || goal === 'bonus' ? 'Bonus check-in' : 'Daily check-in'} back keyboard>
      <Card style={styles.hero}>
        <GoalTile kind={kind} done={done} size={72} />
        <Text variant="title" align="center" accessibilityRole="header">
          {copy.goalText}
        </Text>
        <Text variant="body" tone="soft" align="center">
          {copy.help}
        </Text>
        <View style={styles.rewardRow}>
          <Text variant="caption" tone="muted">
            REWARD
          </Text>
          <Text variant="smallStrong">{copy.reward}</Text>
        </View>
      </Card>

      {goal === 'movement' && state.profile.healthEnabled ? (
        <Card tone="muted" elevated={false} style={styles.activity}>
          <Footprints size={20} color={colors.move} strokeWidth={2.2} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">{activity ? `${activity.steps.toLocaleString()} steps · ${activity.workoutMinutes} min workout` : 'No activity read yet today'}</Text>
            <Text variant="small" tone="muted">
              Targets: {state.profile.movementMinutes} min or {state.profile.stepTarget.toLocaleString()} steps{activity ? ` · synced ${new Date(activity.syncedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}` : ''}
            </Text>
          </View>
        </Card>
      ) : null}

      {goal === 'custom' ? (
        editing ? (
          <Card style={{ gap: spacing.md }}>
            <Field label="Your daily goal" value={goalDraft} onChangeText={setGoalDraft} placeholder="Read 10 pages" maxLength={DEFAULTS.maxCustomGoalLength} autoFocus={!state.profile.customGoal} returnKeyType="done" onSubmitEditing={saveGoal} />
            <View style={styles.row}>
              <Button label="Save goal" onPress={saveGoal} style={{ flex: 1 }} />
              {state.profile.customGoal ? <Button label="Cancel" variant="ghost" onPress={() => setEditing(false)} /> : null}
            </View>
          </Card>
        ) : (
          <Button label="Edit goal" variant="ghost" size="sm" onPress={() => setEditing(true)} style={{ alignSelf: 'center' }} />
        )
      ) : null}

      {done ? (
        <>
          <View style={styles.doneRow} accessibilityLiveRegion="polite">
            <Check size={18} color={colors.success} strokeWidth={3} />
            <Text variant="bodyStrong" tone="sage">
              Completed today{goal === 'movement' && state.today.movementSource === 'health' ? ' · from your health app' : ''}
            </Text>
          </View>
          <Button label="Undo completion" variant="secondary" full icon={<Undo2 size={18} color={colors.ink} />} onPress={undo} />
          <Text variant="small" tone="muted" align="center">
            Tapped by mistake? Undo keeps your records honest. Rewards are earned once per day and are never taken back.
          </Text>
        </>
      ) : goal === 'custom' && !state.profile.customGoal ? (
        <Text variant="small" tone="muted" align="center">
          Save a goal first. Then complete it once a day for {copy.reward}.
        </Text>
      ) : (
        <>
          <Button label="Mark complete" size="lg" full icon={<Check size={18} color={colors.surface} strokeWidth={3} />} onPress={complete} />
          <Text variant="small" tone="muted" align="center">
            Completing this goal earns {copy.reward} and returns you to Today.
          </Text>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  doneRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  activity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
});
