import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { requestWidgetUpdate } from 'react-native-android-widget';

import type { GameState } from '@/game';
import { MochiAndroidWidget, type AndroidWidgetData } from '@/widgets/android/MochiAndroidWidget';
import { ANDROID_WIDGET_KEY, ANDROID_WIDGET_NAME } from '@/widgets/android/taskHandler';

import { renderPetPng } from './widgetImage';
import { buildWidgetSnapshot } from './widgetSnapshot';

export const widgetSupported = true;

let lastImageKey = '';
let lastImage: string | null = null;

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
  await AsyncStorage.setItem(ANDROID_WIDGET_KEY, JSON.stringify(data));
  try {
    await requestWidgetUpdate({
      widgetName: ANDROID_WIDGET_NAME,
      renderWidget: (info) => <MochiAndroidWidget data={data} width={info.width} />,
      widgetNotFound: () => undefined,
    });
  } catch {
    // No widget placed yet, or the native module is unavailable (Expo Go).
  }
}
