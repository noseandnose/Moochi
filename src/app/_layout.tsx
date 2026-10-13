import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { isOnboarded } from '@/game';
import { CelebrationProvider } from '@/state/CelebrationProvider';
import { GameProvider, useGame } from '@/state/GameProvider';
import { HealthSync } from '@/state/HealthSync';
import { WidgetSync } from '@/state/WidgetSync';
import { ToastProvider } from '@/ui/components';
import { colors } from '@/ui/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GameProvider>
        <CelebrationProvider>
          <ToastProvider>
            <StatusBar style="dark" />
            <HealthSync />
            <WidgetSync />
            <Routes />
          </ToastProvider>
        </CelebrationProvider>
      </GameProvider>
    </SafeAreaProvider>
  );
}

function Routes() {
  const { state, ready } = useGame();
  const onboarded = isOnboarded(state);
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);
  if (!ready) return <View style={styles.loading} />;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Protected guard={onboarded}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" options={{ presentation: 'modal', gestureEnabled: true }} />
      </Stack.Protected>
      <Stack.Protected guard={!onboarded}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.background },
});
