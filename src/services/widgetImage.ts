import { FilterMode, MipmapMode, Skia, type SkImage } from '@shopify/react-native-skia';
import { Asset } from 'expo-asset';

import { CELL, SHEETS, bodyCell, overlayCell } from '@/components/pet/sprites';
import { getStage, getVisualPath, type GameState, type PetId } from '@/game';

const cache = new Map<PetId, Promise<SkImage | null>>();

async function loadSheet(petId: PetId): Promise<SkImage | null> {
  if (!cache.has(petId)) {
    cache.set(
      petId,
      (async () => {
        try {
          const asset = Asset.fromModule(SHEETS[petId] as number);
          await asset.downloadAsync();
          const uri = asset.localUri ?? asset.uri;
          const data = await Skia.Data.fromURI(uri);
          return Skia.Image.MakeImageFromEncoded(data);
        } catch {
          return null;
        }
      })(),
    );
  }
  return cache.get(petId)!;
}

/**
 * Renders the current pet (with path accent and gear) to a PNG using an
 * offscreen Skia surface. Returns base64 PNG data, or null if Skia is not
 * ready. `scale` keeps pixels crisp: 3 gives a 384px image.
 */
export async function renderPetPng(state: GameState, scale = 3): Promise<string | null> {
  const petId = state.profile.petId;
  const sheet = await loadSheet(petId);
  if (!sheet) return null;
  const size = CELL * scale;
  const surface = Skia.Surface.MakeOffscreen(size, size);
  if (!surface) return null;
  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color('transparent'));
  const stage = getStage(state);
  const path = getVisualPath(state);
  const cells = [bodyCell(petId, stage, 0, stage === 'egg' ? 'open' : 'happy')];
  if (path !== 'balanced') {
    const c = overlayCell(petId, stage, path);
    if (c) cells.push(c);
  }
  if (state.progress.equippedGear !== 'none') {
    const c = overlayCell(petId, stage, state.progress.equippedGear);
    if (c) cells.push(c);
  }
  const dst = Skia.XYWHRect(0, 0, size, size);
  for (const c of cells) {
    canvas.drawImageRectOptions(sheet, Skia.XYWHRect(c.x, c.y, CELL, CELL), dst, FilterMode.Nearest, MipmapMode.None);
  }
  surface.flush();
  const image = surface.makeImageSnapshot();
  return image.encodeToBase64();
}
