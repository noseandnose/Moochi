import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

/**
 * Web only. Skia's JavaScript bindings read the CanvasKit global when their
 * module is first evaluated, so the router (and every screen) must not load
 * until the WebAssembly build has finished downloading.
 *
 * The site may be served from a sub-path (GitHub Pages project sites live at
 * /<repo>/), so the wasm URL is derived from where the bundle itself was
 * loaded from rather than assumed to be the domain root.
 */
function basePath(): string {
  if (typeof document === 'undefined') return '';
  const bundle = Array.from(document.scripts)
    .map((s) => s.src)
    .find((src) => src.includes('/_expo/'));
  if (!bundle) return '';
  try {
    return new URL(bundle, document.baseURI).pathname.split('/_expo/')[0];
  } catch {
    return '';
  }
}

const base = basePath();

LoadSkiaWeb({ locateFile: (file: string) => `${base}/${file}` })
  .then(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('expo-router/entry');
  })
  .catch((e: unknown) => console.error('CanvasKit failed to load', e));
