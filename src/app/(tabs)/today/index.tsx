import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CoinIcon } from '@/components/icons';
import { GoalCard } from '@/components/home/GoalCard';
import { RewardBanner } from '@/components/home/RewardBanner';
import { PetStage, type PetStageHandle } from '@/components/pet/PetStage';
import {
  GEAR_BY_ID,
  PATH_BY_ID,
  STAGES,
  formatWater,
  getCompletedCount,
  getDailyChallenge,
  getGrowth,
  getStage,
  getVisualPath,
  getWaterConsumedMl,
  isWaterDone,
  type StageId,
} from '@/game';
import { useAnimatedNumber } from '@/hooks/useCounter';
import { useHaptics } from '@/hooks/useHaptics';
import { formatLongDate, useTodayKey, now } from '@/hooks/useNow';
import { summarizeRewards, useCelebration } from '@/state/CelebrationProvider';
import { useGame } from '@/state/GameProvider';
import { Pill, ProgressBar, Ring, Screen, Text } from '@/ui/components';
import { colors, radius, spacing } from '@/ui/theme';

export default function Today() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const { pending, consume, queue } = useCelebration();
  const haptic = useHaptics();
  const todayKey = useTodayKey();
  const stageRef = useRef<PetStageHandle>(null);

  const realStage = getStage(state);
  const [shownStage, setShownStage] = useState<StageId>(realStage);
  const [banner, setBanner] = useState<{ id: number; title: string; xp: number; coins: number } | null>(null);
  const busy = useRef(false);

  const growth = getGrowth(state);
  const path = getVisualPath(state);
  const coins = useAnimatedNumber(state.progress.coins);
  const completed = getCompletedCount(state);
  const waterDone = isWaterDone(state);
  const challenge = getDailyChallenge(state.today.date || todayKey);

  // Present queued celebrations: banner, pet reaction, hatch / evolution.
  useEffect(() => {
    if (!pending || busy.current) return;
    const id = pending.id;
    const { xp, coins: c, stageFrom, stageTo } = summarizeRewards(pending.events);
    consume(id);
    busy.current = true;
    (async () => {
      const name = state.profile.petName;
      const stageName = (s: string | null) => STAGES.find((x) => x.id === s)?.name ?? '';
      if (stageTo && stageFrom === 'egg') {
        haptic('reward');
        await stageRef.current?.hatch();
        setShownStage(stageTo as StageId);
        setBanner({ id, title: `${name} hatched!`, xp, coins: c });
        setTimeout(() => stageRef.current?.celebrate(), 450);
      } else if (stageTo) {
        haptic('reward');
        await stageRef.current?.evolve();
        setShownStage(stageTo as StageId);
        setBanner({ id, title: `${name} grew into a ${stageName(stageTo)}.`, xp, coins: c });
        setTimeout(() => stageRef.current?.celebrate(), 500);
      } else if (xp > 0) {
        haptic('reward');
        const all = pending.events.some((e) => e.type === 'allGoalsCompleted');
        setBanner({ id, title: all ? 'All three done. Bonus earned.' : 'Goal complete. Progress earned.', xp, coins: c });
        stageRef.current?.celebrate();
      } else {
        stageRef.current?.react();
      }
      busy.current = false;
    })();
  }, [pending, consume, haptic, state.profile.petName]);

  // Keep the displayed stage in sync when no animation is pending (e.g. after reset).
  useEffect(() => {
    if (!busy.current && !pending && shownStage !== realStage) setShownStage(realStage);
  }, [realStage, pending, shownStage]);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 7000);
    return () => clearTimeout(t);
  }, [banner]);

  const quickComplete = useCallback(
    (goal: 'movement' | 'eating' | 'bonus') => {
      const events = dispatch({ type: 'setCheckIn', goal, done: true, now: now() });
      queue(events);
    },
    [dispatch, queue],
  );

  const onPetPress = () => {
    haptic('tap');
    stageRef.current?.react();
  };

  const stageMeta = STAGES.find((s) => s.id === shownStage)!;
  const caption = shownStage === 'egg' ? 'Complete goals to hatch your pet.' : 'Tap to interact.';

  return (
    <Screen title="Today" subtitle={formatLongDate(todayKey)} settings inTabs>
      {banner ? <RewardBanner title={banner.title} xp={banner.xp} coins={banner.coins} onDismiss={() => setBanner(null)} /> : null}
      <View style={styles.petHeading}>
        <Text variant="heading" accessibilityRole="header">
          {state.profile.petName}
        </Text>
        <Pill label={`${coins} coins`} tone="coin" icon={<CoinIcon />} accessibilityLabel={`${state.progress.coins} coins`} />
      </View>
      <PetStage
        ref={stageRef}
        petId={state.profile.petId}
        stage={shownStage}
        path={path}
        gear={state.progress.equippedGear}
        height={236}
        onPress={onPetPress}
        accessibilityLabel={`${state.profile.petName}, ${stageMeta.name} stage, ${PATH_BY_ID[path].name} path${state.progress.equippedGear !== 'none' ? `, wearing ${GEAR_BY_ID[state.progress.equippedGear].name}` : ''}`}
      >
        <View style={styles.stageLabel} pointerEvents="none">
          <Text variant="caption" tone="inverse">
            {stageMeta.name.toUpperCase()} · {PATH_BY_ID[path].name.toUpperCase()}
          </Text>
        </View>
        <View style={styles.caption} pointerEvents="none">
          <Text variant="small" tone="soft">
            {caption}
          </Text>
        </View>
      </PetStage>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${growth.isFinalStage ? `Level ${growth.level}` : `${growth.xpToNext} XP to ${growth.nextStageName}`}. View journey`}
        onPress={() => router.navigate('/(tabs)/journey')}
        style={({ pressed }) => [styles.growth, pressed && { opacity: 0.8 }]}
      >
        <View style={styles.growthRow}>
          <Text variant="bodyStrong">{growth.isFinalStage ? `Level ${growth.level} · Companion` : `${growth.xpToNext} XP to ${growth.nextStageName}`}</Text>
          <View style={styles.link}>
            <Text variant="smallStrong" tone="muted">
              Journey
            </Text>
            <ChevronRight size={16} color={colors.inkMuted} />
          </View>
        </View>
        <ProgressBar value={growth.progress} label={`Growth progress toward ${growth.nextStageName ?? 'next level'}`} />
        <Text variant="small" tone="muted">
          {state.progress.xp} XP total · Level {growth.level}
        </Text>
      </Pressable>

      <View style={styles.dailyHeader}>
        <View style={{ flex: 1 }}>
          <Text variant="heading" accessibilityRole="header">
            Daily goals
          </Text>
          <Text variant="small" tone="muted">
            {completed === 3 ? 'All three done. Nice work.' : `${completed} of 3 complete`}
          </Text>
        </View>
        <Ring value={completed / 3} size={60} label={`${completed} of 3 daily goals complete`} caption={`${completed}/3`} color={completed === 3 ? colors.success : colors.ink} />
      </View>

      <GoalCard
        kind="water"
        title="Drink water"
        detail={`${formatWater(getWaterConsumedMl(state), state.profile.waterUnit)} of ${formatWater(state.profile.waterTargetMl, state.profile.waterUnit, 'target')}`}
        done={waterDone}
        reward="25 XP · 5 coins"
        actionLabel="Log water"
        onAction={() => router.push('/(tabs)/today/water')}
        onOpen={() => router.push('/(tabs)/today/water')}
      />
      <GoalCard
        kind="movement"
        title="Move your body"
        detail={`${state.profile.movementMinutes} minutes of movement`}
        done={state.today.movementDone}
        reward="25 XP · 5 coins"
        actionLabel="Done"
        onAction={() => quickComplete('movement')}
        onOpen={() => router.push('/(tabs)/today/goal/movement')}
      />
      <GoalCard
        kind="eating"
        title="Eat well"
        detail={state.profile.eatingGoal}
        done={state.today.eatingDone}
        reward="25 XP · 5 coins"
        actionLabel="Done"
        onAction={() => quickComplete('eating')}
        onOpen={() => router.push('/(tabs)/today/goal/eating')}
      />
      <GoalCard
        kind="bonus"
        title="Daily challenge"
        detail={challenge}
        done={state.today.bonusDone}
        reward="20 XP · 4 coins"
        actionLabel="Done"
        optional
        onAction={() => quickComplete('bonus')}
        onOpen={() => router.push('/(tabs)/today/goal/bonus')}
      />
      <Text variant="small" tone="muted" align="center" style={{ marginTop: spacing.sm }}>
        Complete all three goals for +25 XP and +5 coins. Missed days never remove progress.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  petHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stageLabel: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(32,35,31,0.78)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  caption: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    backgroundColor: 'rgba(255,254,250,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  growth: {
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  growthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  link: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  dailyHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
});
