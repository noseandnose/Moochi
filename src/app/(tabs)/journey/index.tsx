import { useRouter } from 'expo-router';
import { Check, Flame, Medal, Snowflake, Sparkles } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { PetPortrait } from '@/components/pet/PetPortrait';
import {
  PATH_BY_ID,
  STAGES,
  STREAK,
  fromDateKey,
  getAchievements,
  getActiveDays,
  getGrowth,
  getLastSevenDays,
  getStageIndex,
  getStreakInfo,
  getVisualPath,
} from '@/game';
import { useHaptics } from '@/hooks/useHaptics';
import { useNowMinute, useTodayKey } from '@/hooks/useNow';
import { useGame } from '@/state/GameProvider';
import { Button, Card, ProgressBar, Screen, SectionHeading, Text, useToast } from '@/ui/components';
import { colors, radius, spacing } from '@/ui/theme';

export default function Journey() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const toast = useToast();
  const haptic = useHaptics();
  const todayKey = useTodayKey();
  const nowMs = useNowMinute();
  const streak = getStreakInfo(state, nowMs);
  const buyFreeze = () => {
    const events = dispatch({ type: 'buyFreeze' });
    const err = events.find((e) => e.type === 'error');
    if (err && err.type === 'error') {
      toast(err.message, 'danger');
      return;
    }
    haptic('reward');
    toast('Streak freeze added. It is used automatically on a missed day.');
  };
  const growth = getGrowth(state);
  const activeDays = getActiveDays(state).length;
  const week = getLastSevenDays(state, fromDateKey(todayKey).getTime());
  const achievements = getAchievements(state);
  const stageIndex = getStageIndex(state);
  const path = getVisualPath(state);

  return (
    <Screen title="Journey" subtitle="Your goals. Your progress." settings inTabs>
      <View style={styles.metrics}>
        <Card style={styles.metric} accessible accessibilityLabel={`${activeDays} active ${activeDays === 1 ? 'day' : 'days'} recorded`}>
          <Text variant="number">{activeDays}</Text>
          <Text variant="small" tone="soft">
            active {activeDays === 1 ? 'day' : 'days'} recorded
          </Text>
        </Card>
        <Card style={styles.metric} accessible accessibilityLabel={`${state.progress.xp} total XP`}>
          <Text variant="number">{state.progress.xp}</Text>
          <Text variant="small" tone="soft">
            total XP · Level {growth.level}
          </Text>
        </Card>
      </View>

      <SectionHeading title="Streak" />
      <Card style={{ gap: spacing.md }}>
        <View style={styles.streakRow}>
          <View style={[styles.flame, streak.current > 0 && !streak.atRisk && styles.flameLit]}>
            <Flame size={26} color={streak.current > 0 && !streak.atRisk ? colors.surface : streak.atRisk ? colors.danger : colors.inkFaint} strokeWidth={2.4} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="subheading">{streak.current === 0 ? 'No streak yet' : `${streak.current}-day streak`}</Text>
            <Text variant="small" tone={streak.atRisk ? 'danger' : 'soft'}>
              {streak.current === 0
                ? 'One goal a day keeps it going. Any goal counts.'
                : streak.atRisk
                  ? 'At risk: log one goal today to keep it.'
                  : `Today is in. Best: ${streak.best} ${streak.best === 1 ? 'day' : 'days'}.`}
            </Text>
          </View>
        </View>
        <View style={styles.freezeRow}>
          <View style={styles.freezeIcons} accessible accessibilityLabel={`${streak.freezes} of ${streak.maxFreezes} streak freezes held`}>
            {Array.from({ length: streak.maxFreezes }).map((_, i) => (
              <View key={i} style={[styles.freeze, i < streak.freezes && styles.freezeHeld]}>
                <Snowflake size={16} color={i < streak.freezes ? colors.surface : colors.inkFaint} strokeWidth={2.4} />
              </View>
            ))}
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="smallStrong">
              {streak.freezes} {streak.freezes === 1 ? 'freeze' : 'freezes'}
            </Text>
            <Text variant="caption" tone="muted">
              {streak.freezes >= streak.maxFreezes ? 'HOLDING THE MAXIMUM' : `A FREEZE COVERS ONE MISSED DAY · NEXT FREE ONE IN ${streak.daysToNextFreeze} ${streak.daysToNextFreeze === 1 ? 'DAY' : 'DAYS'}`}
            </Text>
          </View>
          <Button label={`${STREAK.freezeCost} coins`} variant="soft" size="sm" disabled={streak.freezes >= streak.maxFreezes || state.progress.coins < STREAK.freezeCost} onPress={buyFreeze} accessibilityLabel={`Buy a streak freeze for ${STREAK.freezeCost} coins`} />
        </View>
      </Card>

      <SectionHeading title="The last 7 days" />
      <View style={styles.week} accessibilityRole="list">
        {week.map((d) => {
          const full = d.completed === 3;
          return (
            <View
              key={d.date}
              accessible
              accessibilityLabel={`${d.weekday} ${d.dayOfMonth}: ${d.completed === null ? 'no record' : `${d.completed} of 3 goals`}${d.bonus ? ', challenge done' : ''}${d.isToday ? ', today' : ''}`}
              style={[styles.day, d.isToday && styles.today, full && styles.dayFull, d.completed !== null && d.completed > 0 && !full && styles.dayPartial]}
            >
              <Text variant="caption" tone={full ? 'inverse' : 'muted'}>
                {d.weekday.toUpperCase()}
              </Text>
              {full ? <Check size={18} color={colors.surface} strokeWidth={3} /> : <Text variant="bodyStrong">{d.dayOfMonth}</Text>}
              <Text variant="caption" tone={full ? 'inverse' : d.completed === null ? 'faint' : 'ink'}>
                {d.completed === null ? '—' : `${d.completed}/3`}
              </Text>
            </View>
          );
        })}
      </View>
      <Text variant="small" tone="muted">
        A dash means no record for that day. Missed days never remove growth. {streak.perfectDays} {streak.perfectDays === 1 ? 'day' : 'days'} with all three goals so far.
      </Text>

      <SectionHeading title="Next evolution" />
      <Card style={{ gap: spacing.sm }}>
        <Text variant="subheading">{growth.isFinalStage ? `Level ${growth.level} · ${growth.xpToNext} XP to level ${growth.level + 1}` : `${growth.xpToNext} XP to ${growth.nextStageName}`}</Text>
        <ProgressBar value={growth.progress} label="Progress to next evolution" />
        <Text variant="small" tone="soft">
          Each daily goal earns 25 XP. {growth.isFinalStage ? 'Your pet is fully grown and keeps leveling.' : `Reach ${STAGES[stageIndex + 1].xp} XP to evolve.`}
        </Text>
      </Card>

      <View style={styles.timeline} accessibilityRole="list">
        {STAGES.map((s, i) => {
          const reached = stageIndex >= i;
          const current = stageIndex === i;
          return (
            <View key={s.id} accessible accessibilityLabel={`${s.name}, ${s.xp} XP${current ? ', current stage' : reached ? ', reached' : ''}`} style={[styles.stageRow, current && styles.stageCurrent]}>
              <PetPortrait petId={state.profile.petId} stage={s.id} path={i >= 2 ? path : 'balanced'} size={64} background={reached ? colors.sageSoft : colors.surfaceMuted} radius={14} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{s.name}</Text>
                <Text variant="small" tone="soft">
                  {s.xp} XP{current ? ' · You are here' : ''}
                  {i >= 2 && reached ? ` · ${PATH_BY_ID[path].name}` : ''}
                </Text>
              </View>
              <View style={[styles.dot, reached && styles.dotReached]}>
                {reached ? <Check size={14} color={colors.surface} strokeWidth={3} /> : <Text variant="caption" tone="muted">{i + 1}</Text>}
              </View>
            </View>
          );
        })}
      </View>
      <Button label="Explore evolution paths" variant="soft" full icon={<Sparkles size={18} color={colors.sageDeep} />} onPress={() => router.push('/(tabs)/journey/evolution')} />

      <SectionHeading title="Achievements" />
      <View style={styles.badges} accessibilityRole="list">
        {achievements.map((a) => (
          <Card key={a.id} style={[styles.badge, !a.earned && styles.badgeLocked]} accessible accessibilityLabel={`${a.title}: ${a.description}. ${a.earned ? 'Earned.' : 'Not yet earned.'}`}>
            <View style={[styles.medal, a.earned && styles.medalEarned]}>
              <Medal size={26} color={a.earned ? colors.surface : colors.inkFaint} strokeWidth={2.2} />
            </View>
            <Text variant="smallStrong" align="center">
              {a.title}
            </Text>
            <Text variant="caption" tone={a.earned ? 'sage' : 'muted'} align="center">
              {a.earned ? 'EARNED' : a.description.toUpperCase()}
            </Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  metrics: { flexDirection: 'row', gap: spacing.md },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flame: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSunken },
  flameLit: { backgroundColor: colors.ink },
  freezeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  freezeIcons: { flexDirection: 'row', gap: 4 },
  freeze: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSunken },
  freezeHeld: { backgroundColor: colors.sage },
  metric: { flex: 1, gap: 2 },
  week: { flexDirection: 'row', gap: 6 },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  today: { borderColor: colors.ink },
  dayPartial: { backgroundColor: colors.sageSoft },
  dayFull: { backgroundColor: colors.ink, borderColor: colors.ink },
  timeline: { gap: spacing.sm },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    paddingRight: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  stageCurrent: { borderColor: colors.ink },
  dot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSunken },
  dotReached: { backgroundColor: colors.success },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  badge: { flexBasis: '47%', flexGrow: 1, alignItems: 'center', gap: 6 },
  badgeLocked: { backgroundColor: colors.surfaceMuted, borderColor: colors.surfaceMuted, shadowOpacity: 0, elevation: 0 },
  medal: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSunken },
  medalEarned: { backgroundColor: colors.sage },
});
