import { useRouter } from 'expo-router';
import { Plus, Settings2, Undo2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { GoalTile } from '@/components/icons';
import { PetPortrait } from '@/components/pet/PetPortrait';
import {
  formatWater,
  getStage,
  getVisualPath,
  getWaterConsumedMl,
  getWaterPercent,
  isWaterDone,
  parseAmount,
  quickAddAmounts,
  toMl,
  unitLabel,
} from '@/game';
import { useBack } from '@/hooks/useBack';
import { useHaptics } from '@/hooks/useHaptics';
import { useCelebration } from '@/state/CelebrationProvider';
import { now } from '@/hooks/useNow';
import { useGame } from '@/state/GameProvider';
import { Button, Card, Field, ProgressBar, Screen, Segmented, Text, useToast } from '@/ui/components';
import { colors, spacing } from '@/ui/theme';

export default function Water() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const { queue } = useCelebration();
  const toast = useToast();
  const haptic = useHaptics();
  const back = useBack();
  const [custom, setCustom] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);

  const unit = state.profile.waterUnit;
  const consumed = getWaterConsumedMl(state);
  const target = state.profile.waterTargetMl;
  const percent = getWaterPercent(state);
  const done = isWaterDone(state);
  const last = state.today.waterEntries[state.today.waterEntries.length - 1];

  const add = (ml: number): boolean => {
    const wasDone = isWaterDone(state);
    const events = dispatch({ type: 'addWater', ml, now: now() });
    const error = events.find((e) => e.type === 'error');
    if (error?.type === 'error') {
      toast(error.message, 'danger');
      haptic('warning');
      return false;
    }
    const completedNow = events.some((e) => e.type === 'goalCompleted');
    if (completedNow && !wasDone) {
      // Today presents the celebration; a toast here would say the same thing twice.
      queue(events);
      haptic('success');
      back();
      return true;
    }
    haptic('tap');
    toast(`Added ${formatWater(ml, unit)}.`);
    return true;
  };

  const addCustom = () => {
    const n = parseAmount(custom);
    if (n === null) {
      setCustomError('Enter an amount greater than zero.');
      haptic('warning');
      return;
    }
    setCustomError(null);
    if (add(toMl(n, unit))) setCustom('');
  };

  const undo = () => {
    const events = dispatch({ type: 'undoWater', now: now() });
    const error = events.find((e) => e.type === 'error');
    if (error?.type === 'error') toast(error.message, 'danger');
    else {
      haptic('select');
      toast('Last drink removed.');
    }
  };

  return (
    <Screen title="Drink water" subtitle="Track your daily target" back keyboard>
      <Card style={styles.hero}>
        <View style={styles.heroRow}>
          <PetPortrait petId={state.profile.petId} stage={getStage(state)} path={getVisualPath(state)} gear={state.progress.equippedGear} size={96} background={colors.waterSoft} eyes={done ? 'happy' : 'open'} />
          <View style={styles.heroText}>
            <Text variant="number" accessibilityLabel={`${formatWater(consumed, unit)} consumed`}>
              {formatWater(consumed, unit)}
            </Text>
            <Text variant="small" tone="soft">
              of {formatWater(target, unit, 'target')} today
            </Text>
            <View style={styles.statusRow}>
              <GoalTile kind="water" done={done} size={24} />
              <Text variant="smallStrong" tone={done ? 'sage' : 'water'}>
                {done ? 'Complete' : `${percent}% of goal`}
              </Text>
            </View>
          </View>
        </View>
        <ProgressBar value={percent / 100} color={done ? colors.success : colors.water} track={colors.waterSoft} label={`Water progress, ${percent} percent`} />
      </Card>

      <View style={styles.quick}>
        {quickAddAmounts(unit).map((q) => (
          <Button key={q.label} label={q.label} size="lg" style={styles.quickButton} icon={<Plus size={18} color={colors.surface} />} onPress={() => add(q.ml)} />
        ))}
      </View>

      <Card>
        <Field
          label={`Custom amount (${unitLabel(unit)})`}
          value={custom}
          onChangeText={(t) => {
            setCustom(t);
            if (customError) setCustomError(null);
          }}
          keyboardType="decimal-pad"
          inputMode="decimal"
          placeholder={unit === 'oz' ? '12' : '350'}
          error={customError}
          returnKeyType="done"
          onSubmitEditing={addCustom}
        />
        <Button label="Add amount" variant="secondary" full onPress={addCustom} style={{ marginTop: spacing.md }} />
      </Card>

      <Button
        label={last ? `Undo last drink · ${formatWater(last.ml, unit)}` : 'Undo last drink'}
        variant="secondary"
        full
        disabled={!last}
        icon={<Undo2 size={18} color={colors.ink} />}
        onPress={undo}
      />

      <Card tone="muted" elevated={false}>
        <Segmented
          label="Display units"
          value={unit}
          onChange={(u) => dispatch({ type: 'setWaterUnit', unit: u })}
          options={[
            { value: 'ml', label: 'ml' },
            { value: 'oz', label: 'US fl oz' },
          ]}
        />
        <Text variant="small" tone="muted" style={{ marginTop: spacing.sm }}>
          Switching units only changes how amounts are shown. Your target is {formatWater(target, unit, 'target')}; reach it for 25 XP and 5 coins.
        </Text>
        <Button label="Change target in Settings" variant="ghost" size="sm" icon={<Settings2 size={16} color={colors.inkSoft} />} onPress={() => router.push('/settings')} style={{ alignSelf: 'flex-start', marginTop: spacing.xs }} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.lg },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  heroText: { flex: 1, gap: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  quick: { flexDirection: 'row', gap: spacing.md },
  quickButton: { flex: 1 },
});
