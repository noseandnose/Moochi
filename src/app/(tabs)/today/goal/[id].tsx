import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Undo2 } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { GoalTile, type TileKind } from '@/components/icons';
import { getDailyChallenge } from '@/game';
import { useHaptics } from '@/hooks/useHaptics';
import { useTodayKey, now } from '@/hooks/useNow';
import { useCelebration } from '@/state/CelebrationProvider';
import { useGame } from '@/state/GameProvider';
import { Button, Card, Screen, Text, useToast } from '@/ui/components';
import { colors, spacing } from '@/ui/theme';

type CheckIn = 'movement' | 'eating' | 'bonus';

export default function GoalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const goal: CheckIn = id === 'eating' || id === 'bonus' ? id : 'movement';
  const router = useRouter();
  const { state, dispatch } = useGame();
  const { queue } = useCelebration();
  const toast = useToast();
  const haptic = useHaptics();
  const todayKey = useTodayKey();

  const done = goal === 'movement' ? state.today.movementDone : goal === 'eating' ? state.today.eatingDone : state.today.bonusDone;
  const copy = {
    movement: {
      title: 'Move your body',
      goalText: `${state.profile.movementMinutes} minutes of movement`,
      help: 'A walk, a workout, stretching, or any movement you enjoy. Log it once you have done it.',
      reward: '25 XP · 5 coins',
    },
    eating: {
      title: 'Eat well',
      goalText: state.profile.eatingGoal,
      help: 'Your own eating goal, in your own words. One honest check-in a day.',
      reward: '25 XP · 5 coins',
    },
    bonus: {
      title: 'Daily challenge',
      goalText: getDailyChallenge(state.today.date || todayKey),
      help: 'An optional extra that changes every day. Skip it freely; it never counts against you.',
      reward: '20 XP · 4 coins',
    },
  }[goal];
  const kind: TileKind = goal;
  const claimed = !!state.ledger[state.today.date]?.[goal];

  const complete = () => {
    const events = dispatch({ type: 'setCheckIn', goal, done: true, now: now() });
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

  return (
    <Screen title={copy.title} subtitle={done ? 'Completed today' : 'Daily check-in'} back>
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
      {done ? (
        <>
          <View style={styles.doneRow} accessibilityLiveRegion="polite">
            <Check size={18} color={colors.success} strokeWidth={3} />
            <Text variant="bodyStrong" tone="sage">
              Completed today
            </Text>
          </View>
          <Button label="Undo completion" variant="secondary" full icon={<Undo2 size={18} color={colors.ink} />} onPress={undo} />
          <Text variant="small" tone="muted" align="center">
            Tapped by mistake? Undo keeps your records honest. Rewards are earned once per day and are never taken back.
          </Text>
        </>
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
});
