import { Stack } from 'expo-router';
import React from 'react';

import { colors } from '@/ui/theme';

export default function StackLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
}
