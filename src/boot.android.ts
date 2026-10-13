import { registerWidgetTaskHandler } from 'react-native-android-widget';

import { widgetTaskHandler } from './widgets/android/taskHandler';

// The widget task handler must be registered before the app entry so it can
// run headlessly when the home screen asks for a render.
registerWidgetTaskHandler(widgetTaskHandler);

// eslint-disable-next-line import/first
import 'expo-router/entry';
