import { Stack } from 'expo-router';
import React from 'react';

import { colors } from '@/ui/theme';

/** Deep links (widget buttons) land on a detail screen with the tab's home underneath it. */
export const unstable_settings = { anchor: 'index' };

export default function StackLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
}
