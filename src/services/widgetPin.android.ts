import { ANDROID_WIDGET_NAME } from '@/widgets/android/constants';

export const canPinWidget = true;

/** Asks the launcher to add the YOUchi widget. Resolves false when the launcher declines or the module is missing (Expo Go). */
export async function pinWidget(): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { requestPinWidget } = require('react-native-android-widget') as typeof import('react-native-android-widget');
    return await requestPinWidget({ widgetName: ANDROID_WIDGET_NAME });
  } catch {
    return false;
  }
}
