import { File, Paths } from 'expo-file-system';

import type { GameState } from '@/game';
import type { MochiWidgetProps } from '@/widgets/MochiWidget';

import { renderPetPng } from './widgetImage';
import { buildWidgetSnapshot } from './widgetSnapshot';

type WidgetModule = { widgetsDirectory: string; widget: { updateSnapshot: (props: MochiWidgetProps) => void } };
let loaded: WidgetModule | null | undefined;

/** expo-widgets needs a development build; in Expo Go the native module is missing. */
function loadWidget(): WidgetModule | null {
  if (loaded !== undefined) return loaded;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { widgetsDirectory } = require('expo-widgets') as { widgetsDirectory: string };
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const widget = (require('@/widgets/MochiWidget') as { default: WidgetModule['widget'] }).default;
    loaded = widgetsDirectory ? { widgetsDirectory, widget } : null;
  } catch {
    loaded = null;
  }
  return loaded;
}

export const widgetSupported = true;

let lastImageKey = '';
let lastImageUri: string | null = null;

/**
 * Writes the pet image into the shared app-group directory and pushes a new
 * snapshot to WidgetKit. Called after every meaningful state change.
 */
export async function syncWidget(state: GameState): Promise<void> {
  const mod = loadWidget();
  if (!mod) return;
  const { widgetsDirectory, widget } = mod;
  const snapshot = buildWidgetSnapshot(state);
  const imageKey = [state.profile.petId, snapshot.stageName, snapshot.pathName, state.progress.equippedGear].join(':');
  if (imageKey !== lastImageKey || !lastImageUri) {
    const base64 = await renderPetPng(state);
    if (base64) {
      const file = new File(Paths.join(widgetsDirectory, 'pet.png'));
      try {
        file.create({ overwrite: true, intermediates: true });
      } catch {
        // write() creates the file when needed.
      }
      file.write(base64, { encoding: 'base64' });
      lastImageUri = file.uri;
      lastImageKey = imageKey;
    }
  }
  widget.updateSnapshot({
    petName: snapshot.petName,
    stageName: snapshot.stageName,
    completed: snapshot.completed,
    bonus: snapshot.bonus,
    level: snapshot.level,
    xpToNext: snapshot.xpToNext,
    nextStageName: snapshot.nextStageName,
    petImage: lastImageUri ?? '',
    isEgg: snapshot.isEgg,
  });
}
