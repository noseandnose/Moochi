import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';

import type { GameState } from '@/game';
import type { AndroidWidgetData } from '@/widgets/android/MochiAndroidWidget';
import { ANDROID_WIDGET_KEY, ANDROID_WIDGET_NAME } from '@/widgets/android/constants';

import { renderPetPng } from './widgetImage';
import { buildWidgetSnapshot } from './widgetSnapshot';

export const widgetSupported = true;

let lastImageKey = '';
let lastImage: string | null = null;
let lastPayload = '';

/** Stores the widget payload for the headless task and asks Android to re-render. */
export async function syncWidget(state: GameState): Promise<void> {
  const snapshot = buildWidgetSnapshot(state);
  const imageKey = [state.profile.petId, snapshot.stageName, snapshot.pathName, state.progress.equippedGear, snapshot.mood].join(':');
  if (imageKey !== lastImageKey || !lastImage) {
    const base64 = await renderPetPng(state, 2);
    if (base64) {
      lastImage = `data:image/png;base64,${base64}`;
      lastImageKey = imageKey;
    }
  }
  const data: AndroidWidgetData = { ...snapshot, petImage: lastImage };
  const payload = JSON.stringify(data);
  if (payload === lastPayload) return; // nothing the widget shows has changed
  lastPayload = payload;
  await AsyncStorage.setItem(ANDROID_WIDGET_KEY, payload);
  try {
    // Lazy: the native module is missing in Expo Go and throws at import time.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { requestWidgetUpdate } = require('react-native-android-widget') as typeof import('react-native-android-widget');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { MochiAndroidWidget } = require('@/widgets/android/MochiAndroidWidget') as typeof import('@/widgets/android/MochiAndroidWidget');
    await requestWidgetUpdate({
      widgetName: ANDROID_WIDGET_NAME,
      renderWidget: (info) => <MochiAndroidWidget data={data} width={info.width} />,
      widgetNotFound: () => undefined,
    });
  } catch {
    // No widget placed yet, or the native module is unavailable (Expo Go).
  }
}
