import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

/**
 * Web preview only. Skia's JavaScript bindings read the CanvasKit global when
 * their module is first evaluated, so the router (and every screen) must not
 * load until the WebAssembly build has finished downloading.
 */
LoadSkiaWeb({ locateFile: (file: string) => `/${file}` })
  .then(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('expo-router/entry');
  })
  .catch((e: unknown) => console.error('CanvasKit failed to load', e));
