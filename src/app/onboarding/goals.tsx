import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { ProfileForm, defaultTargetFor } from '@/components/screens/ProfileForm';
import { DEFAULTS, PETS, PET_BY_ID, type PetId } from '@/game';
import { useHaptics } from '@/hooks/useHaptics';
import { now } from '@/hooks/useNow';
import { useGame } from '@/state/GameProvider';
import { Screen, Text, useToast } from '@/ui/components';

export default function Goals() {
  const { pet } = useLocalSearchParams<{ pet?: string }>();
  const petId: PetId = PETS.some((p) => p.id === pet) ? (pet as PetId) : 'tofu';
  const { dispatch } = useGame();
  const toast = useToast();
  const haptic = useHaptics();
  return (
    <Screen title="Set your goals" subtitle="Step 2 of 2" back keyboard>
      <Text variant="body" tone="soft">
        Name {PET_BY_ID[petId].name}, pick your units and set targets you can actually hit. Everything can change later in Settings.
      </Text>
      <ProfileForm
        initial={{
          petName: PET_BY_ID[petId].name,
          gender: 'unspecified',
          waterUnit: 'ml',
          waterTargetMl: defaultTargetFor('unspecified'),
          movementMinutes: DEFAULTS.movementMinutes,
          eatingGoal: DEFAULTS.eatingGoal,
        }}
        submitLabel="Start playing"
        onSubmit={(values) => {
          const events = dispatch({ type: 'completeOnboarding', input: { petId, ...values }, now: now() });
          const error = events.find((e) => e.type === 'error');
          if (error && error.type === 'error') {
            toast(error.message, 'danger');
            return;
          }
          haptic('success');
          // The root layout swaps to the tabs automatically once onboarding is complete.
        }}
      />
    </Screen>
  );
}
