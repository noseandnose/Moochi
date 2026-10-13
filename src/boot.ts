import { Platform } from 'react-native';

// Register the iOS widget layout at launch so a widget placed before the
// app has synced still has something to draw. Expo Go lacks the module.
if (Platform.OS === 'ios') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('./widgets/MochiWidget');
  } catch {
    // Not available in this build.
  }
}

// eslint-disable-next-line import/first
import 'expo-router/entry';
