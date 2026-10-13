import { requestPinWidget } from 'react-native-android-widget';

import { ANDROID_WIDGET_NAME } from '@/widgets/android/taskHandler';

export const canPinWidget = true;

/** Asks the launcher to add the MOCHI widget. Resolves false when the launcher declines or the module is missing (Expo Go). */
export async function pinWidget(): Promise<boolean> {
  try {
    return await requestPinWidget({ widgetName: ANDROID_WIDGET_NAME });
  } catch {
    return false;
  }
}
