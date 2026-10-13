import type { GameState } from '@/game';

/** Web and other platforms have no home screen widget. */
export async function syncWidget(_state: GameState): Promise<void> {}

export const widgetSupported = false;
