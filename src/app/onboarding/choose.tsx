import { useRouter } from 'expo-router';
import React, { useState } from 'react';

import { PetChoice } from '@/components/screens/PetChoice';
import { PET_BY_ID, type PetId } from '@/game';
import { useHaptics } from '@/hooks/useHaptics';
import { Button, Screen, Text } from '@/ui/components';

export default function Choose() {
  const router = useRouter();
  const haptic = useHaptics();
  const [selected, setSelected] = useState<PetId>('foxi');
  return (
    <Screen title="Choose your pet" subtitle="Step 1 of 2" back>
      <Text variant="body" tone="soft">
        Three pets. Three personalities. You can switch later and keep your progress.
      </Text>
      <PetChoice
        selected={selected}
        onSelect={(id) => {
          setSelected(id);
          haptic('select');
        }}
      />
      <Button label={`Continue with ${PET_BY_ID[selected].name}`} size="lg" full onPress={() => router.push({ pathname: '/onboarding/goals', params: { pet: selected } })} />
    </Screen>
  );
}
