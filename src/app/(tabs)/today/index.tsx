import { useIsFocused, useRouter } from 'expo-router';
import { ChevronRight, Flame } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoinIcon } from '@/components/icons';
import { BonusCarousel, type BonusTile } from '@/components/home/BonusCarousel';
import { CoachMark } from '@/components/home/CoachMark';
import { WidgetPrompt } from '@/components/home/WidgetPrompt';
import { GoalCard } from '@/components/home/GoalCard';
import { RewardBanner } from '@/components/home/RewardBanner';
import { PetStage, type PetStageHandle } from '@/components/pet/PetStage';
import {
  GEAR_BY_ID,
  PATH_BY_ID,
  STAGES,
  formatWater,
  getBonusCount,
  getCompletedCount,
  getDailyChallenge,
  getPetMood,
  getStreakInfo,
  getTodaySelfie,
  moodLine,
  getGrowth,
  getStage,
  getVisualPath,
  getWaterConsumedMl,
  isWaterDone,
  type StageId,
} from '@/game';
import { useAnimatedNumber } from '@/hooks/useCounter';
import { useSelfie } from '@/hooks/useSelfie';
import { selfieUri } from '@/services/selfies';
import { canPinWidget, pinWidget } from '@/services/widgetPin';
import { widgetSupported } from '@/services/widgetSync';
import { useHaptics } from '@/hooks/useHaptics';
import { formatLongDate, now, useNowMinute, useTodayKey } from '@/hooks/useNow';
import { summarizeRewards, useCelebration } from '@/state/CelebrationProvider';
import { useGame } from '@/state/GameProvider';
import { Pill, ProgressBar, Ring, Screen, Text } from '@/ui/components';
import { colors, radius, spacing } from '@/ui/theme';

export default function Today() {
  const router = useRouter();
  const { state, dispatch, returnGapDays, launchNotice, persistFailed } = useGame();
  const focused = useIsFocused();
  const { pending, consume, queue } = useCelebration();
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const haptic = useHaptics();
  const todayKey = useTodayKey();
  const insets = useSafeAreaInsets();
  const stageRef = useRef<PetStageHandle>(null);

  const realStage = getStage(state);
  const [shownStage, setShownStage] = useState<StageId>(realStage);
  const [banner, setBanner] = useState<{
    id: number;
    title: string;
    xp: number;
    coins: number;
  } | null>(null);
  const busy = useRef(false);
  // Bumped when an animation finishes so the effect below looks for the next celebration.
  const [turn, setTurn] = useState(0);

  const growth = getGrowth(state);
  const path = getVisualPath(state);
  const coins = useAnimatedNumber(state.progress.coins);
  const completed = getCompletedCount(state);
  const waterDone = isWaterDone(state);
  const challenge = getDailyChallenge(state.today.date || todayKey);
  const selfie = useSelfie();
  const todaySelfie = getTodaySelfie(state);
  const nowMs = useNowMinute();
  const mood = getPetMood(state, nowMs);
  const streak = getStreakInfo(state, nowMs);
  const activity = state.today.activity;
  const movementDetail =
    state.profile.healthEnabled && activity
      ? `${activity.steps.toLocaleString()} steps · ${activity.workoutMinutes} min workout · goal ${state.profile.movementMinutes} min`
      : `${state.profile.movementMinutes} minutes of movement`;

  // Present queued celebrations: banner, pet reaction, hatch / evolution. One at a
  // time, only while this screen is on screen, and never dropped: `turn` re-runs the
  // effect once an animation finishes so the next queued celebration plays.
  useEffect(() => {
    if (!pending || busy.current || !focused) return;
    const id = pending.id;
    const { xp, coins: c, stageFrom, stageTo, streak: streakNow, freezeEarned } = summarizeRewards(pending.events);
    const streakNote = freezeEarned ? ` Day ${streakNow}: you earned a streak freeze.` : streakNow >= 2 ? ` Day ${streakNow} of your streak.` : '';
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
        setBanner({
          id,
          title: `${name} grew into a ${stageName(stageTo)}.`,
          xp,
          coins: c,
        });
        setTimeout(() => stageRef.current?.celebrate(), 500);
      } else if (xp > 0) {
        haptic('reward');
        const all = pending.events.some((e) => e.type === 'allGoalsCompleted');
        setBanner({
          id,
          title: (all ? 'All three done. Bonus earned.' : 'Goal complete. Progress earned.') + streakNote,
          xp,
          coins: c,
        });
        stageRef.current?.celebrate();
      } else {
        stageRef.current?.react();
      }
      busy.current = false;
      setTurn((t) => t + 1);
    })();
  }, [pending, consume, haptic, state.profile.petName, focused, turn]);

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
    (goal: 'movement' | 'eating' | 'bonus' | 'custom') => {
      const events = dispatch({
        type: 'setCheckIn',
        goal,
        done: true,
        now: now(),
      });
      queue(events);
    },
    [dispatch, queue],
  );

  const bonusTiles: BonusTile[] = [
    {
      id: 'selfie',
      title: 'Progress photo',
      detail: 'Upper body, same spot, once a day.',
      done: state.today.selfieDone,
      actionLabel: 'Take photo',
      onAction: selfie.start,
      onOpen: () => router.push('/(tabs)/today/progress'),
      imageUri: todaySelfie ? selfieUri(todaySelfie.file) : undefined,
    },
    {
      id: 'bonus',
      title: 'Daily challenge',
      detail: challenge,
      done: state.today.bonusDone,
      actionLabel: 'Done',
      onAction: () => quickComplete('bonus'),
      onOpen: () => router.push('/(tabs)/today/goal/bonus'),
    },
    {
      id: 'custom',
      title: state.profile.customGoal ? 'Your goal' : 'Your own goal',
      detail: state.profile.customGoal || 'Add a daily goal in your own words.',
      done: state.today.customDone,
      actionLabel: state.profile.customGoal ? 'Done' : 'Set goal',
      needsSetup: !state.profile.customGoal,
      onAction: () => (state.profile.customGoal ? quickComplete('custom') : router.push('/(tabs)/today/goal/custom')),
      onOpen: () => router.push('/(tabs)/today/goal/custom'),
    },
  ];

  const onPetPress = () => {
    haptic('tap');
    // Touching the pet is activity: it wakes a sleeping pet for real (widget and reminders included).
    if (mood === 'asleep') dispatch({ type: 'wake', now: now() });
    stageRef.current?.react();
  };

  // One card at a time at the top of the screen, most important first.
  const showWelcome = (returnGapDays >= 2 || !!launchNotice) && !welcomeDismissed;
  const topCard = showWelcome ? 'welcome' : !state.prefs.coachMarkSeen ? 'coach' : widgetSupported && !state.prefs.widgetPromptSeen && realStage !== 'egg' ? 'widget' : null;

  const stageMeta = STAGES.find((s) => s.id === shownStage)!;
  const caption =
    shownStage === 'egg'
      ? 'Complete goals to hatch'
      : mood === 'asleep'
        ? 'Asleep · tap to wake'
        : mood === 'thirsty'
          ? 'Thirsty · log water'
          : mood === 'hungry'
            ? 'Hungry · eat well'
            : mood === 'lazy'
              ? 'Restless · move'
              : 'Happy · all done';

  return (
    <View style={styles.root}>
      <Screen title="Today" subtitle={formatLongDate(todayKey)} settings inTabs contentContainerStyle={styles.content}>
        {persistFailed ? (
          <View style={styles.warning} accessibilityRole="alert">
            <Text variant="smallStrong" tone="danger">
              Progress could not be saved to this device.
            </Text>
            <Text variant="small" tone="soft">
              Free up some storage, then log something again. Settings → Backup can export a copy.
            </Text>
          </View>
        ) : null}
        {topCard === 'welcome' ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Welcome back. Dismiss." onPress={() => setWelcomeDismissed(true)} style={styles.welcome}>
            <Text variant="bodyStrong">Welcome back.</Text>
            <Text variant="small" tone="soft">
              {returnGapDays >= 2 ? `${returnGapDays} days away and ${state.profile.petName} kept everything: XP, coins, gear. ` : ''}
              {launchNotice ?? 'Today is a fresh start.'}
            </Text>
          </Pressable>
        ) : null}
        {topCard === 'coach' ? <CoachMark petName={state.profile.petName} onDismiss={() => dispatch({ type: 'updatePrefs', patch: { coachMarkSeen: true } })} /> : null}
        {topCard === 'widget' ? (
          <WidgetPrompt
            petName={state.profile.petName}
            direct={canPinWidget}
            onDismiss={() =>
              dispatch({
                type: 'updatePrefs',
                patch: { widgetPromptSeen: true },
              })
            }
            onAdd={async () => {
              if (canPinWidget && (await pinWidget())) {
                dispatch({
                  type: 'updatePrefs',
                  patch: { widgetPromptSeen: true },
                });
                return;
              }
              dispatch({
                type: 'updatePrefs',
                patch: { widgetPromptSeen: true },
              });
              router.push('/widget');
            }}
          />
        ) : null}
        <View style={styles.petHeading}>
          <Text variant="subheading" accessibilityRole="header">
            {state.profile.petName}
          </Text>
          <View style={styles.pills}>
            <Pressable
              accessibilityRole="button"
              hitSlop={6}
              accessibilityLabel={
                streak.current === 0 ? 'No streak yet. One goal a day starts one. View journey' : `${streak.current} day streak${streak.atRisk ? ', at risk today' : ''}. View journey`
              }
              onPress={() => router.navigate('/(tabs)/journey')}
            >
              <Pill
                label={streak.current === 0 ? 'Start a streak' : `${streak.current} day${streak.current === 1 ? '' : 's'}`}
                tone={streak.current > 0 && !streak.atRisk ? 'ink' : 'surface'}
                icon={<Flame size={15} color={streak.current > 0 && !streak.atRisk ? colors.coin : streak.atRisk ? colors.danger : colors.inkMuted} strokeWidth={2.4} />}
              />
            </Pressable>
            <Pill label={`${coins} ${coins === 1 ? 'coin' : 'coins'}`} tone="coin" icon={<CoinIcon />} accessibilityLabel={`${state.progress.coins} coins`} />
          </View>
        </View>
        <PetStage
          ref={stageRef}
          petId={state.profile.petId}
          stage={shownStage}
          path={path}
          gear={state.progress.equippedGear}
          height={164}
          petScale={1.0}
          mood={shownStage === 'egg' ? undefined : mood}
          onPress={onPetPress}
          accessibilityLabel={`${state.profile.petName}, ${stageMeta.name} stage, ${PATH_BY_ID[path].name} path${state.progress.equippedGear !== 'none' ? `, wearing ${GEAR_BY_ID[state.progress.equippedGear].name}` : ''}. ${shownStage === 'egg' ? '' : moodLine(mood, state.profile.petName)}`}
        >
          <View style={styles.stageLabel} pointerEvents="none">
            <Text variant="caption" tone="inverse">
              {stageMeta.name.toUpperCase()} · {PATH_BY_ID[path].name.toUpperCase()}
            </Text>
          </View>
          <View style={styles.caption} pointerEvents="none">
            <Text variant="caption" tone="soft">
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
            <Text variant="smallStrong">{growth.isFinalStage ? `Level ${growth.level} · Companion` : `${growth.xpToNext} XP to ${growth.nextStageName}`}</Text>
            <View style={styles.link}>
              <Text variant="small" tone="muted">
                {state.progress.xp} XP · Lv {growth.level}
              </Text>
              <ChevronRight size={16} color={colors.inkMuted} />
            </View>
          </View>
          <ProgressBar value={growth.progress} height={7} label={`Growth progress toward ${growth.nextStageName ?? 'next level'}`} />
        </Pressable>

        <View style={styles.dailyHeader}>
          <View style={{ flex: 1 }}>
            <Text variant="subheading" accessibilityRole="header">
              Daily goals
            </Text>
            <Text variant="small" tone="muted">
              {completed === 3 ? 'All three done. Bonus earned.' : `${completed} of 3 done · 25 XP each · all three +25`}
            </Text>
          </View>
          <Ring value={completed / 3} size={44} stroke={5} label={`${completed} of 3 daily goals complete`} caption={`${completed}/3`} color={completed === 3 ? colors.success : colors.ink} />
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
          detail={movementDetail}
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
        <BonusCarousel tiles={bonusTiles} doneCount={getBonusCount(state)} />
      </Screen>
      {/* Rewards float over the content so nothing below them moves. */}
      {banner ? (
        <View style={[styles.bannerHost, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
          <RewardBanner title={banner.title} xp={banner.xp} coins={banner.coins} onDismiss={() => setBanner(null)} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bannerHost: {
    position: 'absolute',
    left: spacing.screen,
    right: spacing.screen,
    zIndex: 10,
  },
  content: { gap: 10 },
  warning: { gap: 2, backgroundColor: colors.dangerSoft, borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  welcome: {
    gap: 2,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  petHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pills: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
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
    top: 14,
    right: 12,
    backgroundColor: 'rgba(255,254,250,0.85)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  growth: {
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  growthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  link: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  dailyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: 2,
  },
});
