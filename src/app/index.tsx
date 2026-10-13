import { Redirect } from 'expo-router';
import React from 'react';

import { isOnboarded } from '@/game';
import { useGameState } from '@/state/GameProvider';

export default function Index() {
  const onboarded = isOnboarded(useGameState());
  return <Redirect href={onboarded ? '/(tabs)/today' : '/onboarding'} />;
}
