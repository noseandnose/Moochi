import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  DEFAULTS,
  displayAmount,
  formatWater,
  parseAmount,
  toMl,
  unitLabel,
  type Gender,
  type WaterUnit,
} from '@/game';
import { Button, Card, Field, Segmented, Text } from '@/ui/components';
import { spacing } from '@/ui/theme';

export interface ProfileValues {
  petName: string;
  gender: Gender;
  waterUnit: WaterUnit;
  waterTargetMl: number;
  movementMinutes: number;
  eatingGoal: string;
  customGoal?: string;
}

export interface ProfileFormProps {
  initial: ProfileValues;
  submitLabel: string;
  onSubmit: (values: ProfileValues) => void;
  /** Hide the pet name field (My pet has its own rename). */
  showName?: boolean;
  /** Show the optional custom daily goal (settings only). */
  showCustomGoal?: boolean;
  compact?: boolean;
}

export function defaultTargetFor(gender: Gender): number {
  if (gender === 'female') return DEFAULTS.waterTargetFemaleMl;
  if (gender === 'male') return DEFAULTS.waterTargetMaleMl;
  return DEFAULTS.waterTargetUnspecifiedMl;
}

function targetToText(ml: number, unit: WaterUnit): string {
  const v = displayAmount(ml, unit, 'target');
  return unit === 'oz' ? String(v) : String(Math.round(v));
}

export function ProfileForm({ initial, submitLabel, onSubmit, showName = true, showCustomGoal = false, compact }: ProfileFormProps) {
  const [petName, setPetName] = useState(initial.petName);
  const [gender, setGender] = useState<Gender>(initial.gender);
  const [unit, setUnit] = useState<WaterUnit>(initial.waterUnit);
  const [targetMl, setTargetMl] = useState(initial.waterTargetMl);
  const [targetText, setTargetText] = useState(targetToText(initial.waterTargetMl, initial.waterUnit));
  const [minutesText, setMinutesText] = useState(String(initial.movementMinutes));
  const [eatingGoal, setEatingGoal] = useState(initial.eatingGoal);
  const [customGoal, setCustomGoal] = useState(initial.customGoal ?? '');
  const [touched, setTouched] = useState(false);

  const targetError = useMemo(() => {
    const n = parseAmount(targetText);
    if (n === null) return 'Enter a water target greater than zero.';
    const ml = toMl(n, unit);
    if (ml < DEFAULTS.minWaterTargetMl) return `Minimum is ${formatWater(DEFAULTS.minWaterTargetMl, unit, 'target')}.`;
    if (ml > DEFAULTS.maxWaterTargetMl) return `Maximum is ${formatWater(DEFAULTS.maxWaterTargetMl, unit, 'target')}.`;
    return null;
  }, [targetText, unit]);

  const nameError = showName && !petName.trim() ? 'Give your pet a name.' : null;

  const minutesError = useMemo(() => {
    const n = Number(minutesText);
    if (!/^\d+$/.test(minutesText.trim()) || !Number.isFinite(n)) return 'Enter whole minutes.';
    if (n < DEFAULTS.minMovementMinutes || n > DEFAULTS.maxMovementMinutes) {
      return `Choose between ${DEFAULTS.minMovementMinutes} and ${DEFAULTS.maxMovementMinutes} minutes.`;
    }
    return null;
  }, [minutesText]);

  const onGender = (g: Gender) => {
    setGender(g);
    // Editable app defaults, not medical advice. Only applied when the user changes gender.
    const ml = defaultTargetFor(g);
    setTargetMl(ml);
    setTargetText(targetToText(ml, unit));
  };

  const onUnit = (u: WaterUnit) => {
    // Presentation only. The millilitre value stays the source of truth unless
    // the text was edited, so ml -> oz -> ml never drifts by rounding.
    const n = parseAmount(targetText);
    const edited = n !== null && targetText.trim() !== targetToText(targetMl, unit);
    const ml = edited ? toMl(n, unit) : targetMl;
    setTargetMl(ml);
    setUnit(u);
    setTargetText(targetToText(ml, u));
  };

  const onTargetBlur = () => {
    const n = parseAmount(targetText);
    if (n !== null) {
      const ml = Math.min(DEFAULTS.maxWaterTargetMl, Math.max(DEFAULTS.minWaterTargetMl, toMl(n, unit)));
      setTargetMl(ml);
    }
  };

  const submit = () => {
    setTouched(true);
    const n = parseAmount(targetText);
    if (targetError || minutesError || nameError || n === null) return;
    const edited = targetText.trim() !== targetToText(targetMl, unit);
    onSubmit({
      petName: petName.trim(),
      gender,
      waterUnit: unit,
      waterTargetMl: edited ? toMl(n, unit) : targetMl,
      movementMinutes: Number(minutesText),
      eatingGoal: eatingGoal.trim(),
      ...(showCustomGoal ? { customGoal: customGoal.trim() } : {}),
    });
  };

  return (
    <View style={styles.form}>
      {showName ? (
        <Field label="Pet name" value={petName} onChangeText={setPetName} maxLength={DEFAULTS.maxPetNameLength} autoCapitalize="words" autoCorrect={false} returnKeyType="done" error={touched ? nameError : null} />
      ) : null}
      <Segmented<Gender>
        label="Gender"
        value={gender}
        onChange={onGender}
        options={[
          { value: 'female', label: 'Female' },
          { value: 'male', label: 'Male' },
          { value: 'unspecified', label: 'Prefer not to say' },
        ]}
      />
      <Text variant="small" tone="muted" style={styles.note}>
        Gender only sets a starting water target ({formatWater(DEFAULTS.waterTargetFemaleMl, unit, 'target')} or{' '}
        {formatWater(DEFAULTS.waterTargetMaleMl, unit, 'target')}). It is an editable default, not medical advice, and it changes nothing else.
      </Text>
      <Segmented<WaterUnit>
        label="Water units"
        value={unit}
        onChange={onUnit}
        options={[
          { value: 'ml', label: 'Millilitres (ml)' },
          { value: 'oz', label: 'US fl oz' },
        ]}
      />
      <Field
        label="Daily water target"
        value={targetText}
        onChangeText={setTargetText}
        onBlur={onTargetBlur}
        keyboardType="decimal-pad"
        inputMode="decimal"
        suffix={unitLabel(unit)}
        error={touched ? targetError : null}
        hint={!touched && !compact ? 'Change it any time in Settings.' : undefined}
      />
      <Field
        label="Movement each day"
        value={minutesText}
        onChangeText={setMinutesText}
        keyboardType="number-pad"
        inputMode="numeric"
        suffix="minutes"
        error={touched ? minutesError : null}
      />
      <Field label="Eating goal" value={eatingGoal} onChangeText={setEatingGoal} maxLength={DEFAULTS.maxEatingGoalLength} placeholder={DEFAULTS.eatingGoal} returnKeyType="done" />
      {showCustomGoal ? (
        <Field label="Your own daily goal (bonus)" value={customGoal} onChangeText={setCustomGoal} maxLength={DEFAULTS.maxCustomGoalLength} placeholder="Read 10 pages" hint="Optional. Shown as the third bonus tile; leave empty to hide it." returnKeyType="done" />
      ) : null}
      <Button label={submitLabel} size="lg" full onPress={submit} style={{ marginTop: spacing.sm }} />
    </View>
  );
}

export function ProfileCard({ children }: { children: React.ReactNode }) {
  return <Card>{children}</Card>;
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  note: { marginTop: -8 },
});
