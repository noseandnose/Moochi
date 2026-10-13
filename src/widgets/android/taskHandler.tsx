import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { MochiAndroidWidget, type AndroidWidgetData } from './MochiAndroidWidget';

export const ANDROID_WIDGET_KEY = 'mochi.widget.v1';
export const ANDROID_WIDGET_NAME = 'MochiWidget';

async function readData(): Promise<AndroidWidgetData | null> {
  try {
    const raw = await AsyncStorage.getItem(ANDROID_WIDGET_KEY);
    return raw ? (JSON.parse(raw) as AndroidWidgetData) : null;
  } catch {
    return null;
  }
}

/** Runs headlessly when Android asks the widget to render or update. */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (props.widgetInfo.widgetName !== ANDROID_WIDGET_NAME) return;
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
    case 'WIDGET_CLICK': {
      const data = await readData();
      props.renderWidget(<MochiAndroidWidget data={data} width={props.widgetInfo.width} />);
      break;
    }
    default:
      break;
  }
}
