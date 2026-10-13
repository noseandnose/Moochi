import AsyncStorage from '@react-native-async-storage/async-storage';

import type { GameState } from '@/game';

export const STORAGE_KEY = 'mochi.game.v1';
export const BACKUP_PREFIX = 'mochi.game.backup.';

/** Reads the raw persisted payload. Returns `undefined` when nothing is stored. */
export async function readRaw(): Promise<{ raw: unknown; parseError?: string } | undefined> {
  const text = await AsyncStorage.getItem(STORAGE_KEY);
  if (text === null) return undefined;
  try {
    return { raw: JSON.parse(text) };
  } catch (e) {
    return { raw: text, parseError: e instanceof Error ? e.message : 'parse error' };
  }
}

/** Keeps an unreadable payload around instead of silently discarding it. */
export async function backupCorrupt(payload: unknown): Promise<void> {
  try {
    const text = typeof payload === 'string' ? payload : JSON.stringify(payload);
    await AsyncStorage.setItem(`${BACKUP_PREFIX}${Date.now()}`, text);
  } catch {
    // Best effort only.
  }
}

let queue: Promise<void> = Promise.resolve();

/** Serialises writes so the latest state always lands last. */
export function writeState(state: GameState): Promise<void> {
  const text = JSON.stringify(state);
  queue = queue.then(() => AsyncStorage.setItem(STORAGE_KEY, text)).catch(() => undefined);
  return queue;
}

export async function clearState(): Promise<void> {
  await queue;
  await AsyncStorage.removeItem(STORAGE_KEY);
}
