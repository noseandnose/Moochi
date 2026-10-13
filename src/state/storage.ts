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

let writing: Promise<void> | null = null;
let latest: GameState | null = null;
let lastWritten: GameState | null = null;

/**
 * Persists the newest state. Intermediate states that arrive while a write
 * is in flight are skipped: only the latest one is written once the current
 * write settles, so a burst of taps costs one write, not one per tap.
 * Resolves true when the state is on disk, false when the write failed.
 */
export function writeState(state: GameState): Promise<boolean> {
  latest = state;
  if (writing) return writing.then(() => lastWritten === latest);
  const run = async (): Promise<void> => {
    while (latest && latest !== lastWritten) {
      const target = latest;
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(target));
        lastWritten = target;
      } catch {
        // Leave lastWritten as is; the caller learns the write failed.
        break;
      }
    }
  };
  writing = run().finally(() => {
    writing = null;
  });
  return writing.then(() => lastWritten === state || lastWritten === latest);
}

export async function clearState(): Promise<void> {
  if (writing) await writing;
  latest = null;
  lastWritten = null;
  await AsyncStorage.removeItem(STORAGE_KEY);
}
