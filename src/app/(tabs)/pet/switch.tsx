import { useRouter } from 'expo-router';
import React, { useState } from 'react';

import { PetChoice } from '@/components/screens/PetChoice';
import { PET_BY_ID, type PetId } from '@/game';
import { useHaptics } from '@/hooks/useHaptics';
import { useGame } from '@/state/GameProvider';
import { Button, Screen, Text, useToast } from '@/ui/components';

export default function SwitchPet() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const toast = useToast();
  const haptic = useHaptics();
  const [selected, setSelected] = useState<PetId>(state.profile.petId);
  return (
    <Screen title="Change pet" subtitle="Switch pets. Keep your progress." back>
      <Text variant="body" tone="soft">
        XP, coins, gear and your habit record stay exactly as they are. Only the character and habitat change.
      </Text>
      <PetChoice
        selected={selected}
        onSelect={(id) => {
          setSelected(id);
          haptic('select');
        }}
      />
      <Button
        label={selected === state.profile.petId ? 'Keep current pet' : `Switch to ${PET_BY_ID[selected].name}`}
        size="lg"
        full
        onPress={() => {
          if (selected !== state.profile.petId) {
            dispatch({ type: 'selectPet', petId: selected });
            toast(`${PET_BY_ID[selected].name} is your pet now.`);
            haptic('success');
          }
          router.back();
        }}
      />
    </Screen>
  );
}
