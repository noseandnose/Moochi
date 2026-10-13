import { Skia, loadData, type DataSourceParam, type SkImage } from '@shopify/react-native-skia';
import { useEffect, useState } from 'react';

/**
 * Skia's useImage decodes its source on every mount, so each portrait, grid
 * tile and stage re-reads the same sprite sheet and shows nothing until it
 * arrives. This keeps one decoded image per source for the life of the app:
 * the first mount loads it, every later mount renders it on the first frame.
 */
const images = new Map<DataSourceParam, SkImage | null>();
const inflight = new Map<DataSourceParam, Promise<SkImage | null>>();

export function loadCachedImage(source: DataSourceParam): Promise<SkImage | null> {
  const hit = images.get(source);
  if (hit !== undefined) return Promise.resolve(hit);
  const pending = inflight.get(source);
  if (pending) return pending;
  // Bound, as Skia's own useImage does: the web factory reads `this.CanvasKit`.
  const p = loadData(source, (data) => Skia.Image.MakeImageFromEncoded(data))
    .then((img) => {
      images.set(source, img);
      inflight.delete(source);
      return img;
    })
    .catch(() => {
      inflight.delete(source);
      return null;
    });
  inflight.set(source, p);
  return p;
}

export function useCachedImage(source: DataSourceParam): SkImage | null {
  const cached = images.get(source) ?? null;
  const [loaded, setLoaded] = useState<SkImage | null>(null);
  useEffect(() => {
    if (images.has(source)) return;
    let active = true;
    loadCachedImage(source).then((img) => {
      if (active) setLoaded(img);
    });
    return () => {
      active = false;
    };
  }, [source]);
  return cached ?? loaded;
}
