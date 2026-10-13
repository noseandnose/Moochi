// The Android widget needs a headless task handler registered before the
// router mounts. The native module is absent in Expo Go, where requiring the
// package throws at import time, so load it lazily and skip when missing.
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { registerWidgetTaskHandler } = require('react-native-android-widget') as typeof import('react-native-android-widget');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { widgetTaskHandler } = require('./widgets/android/taskHandler') as typeof import('./widgets/android/taskHandler');
  registerWidgetTaskHandler(widgetTaskHandler);
} catch {
  // No widget support in this build.
}

// eslint-disable-next-line import/first
import 'expo-router/entry';
