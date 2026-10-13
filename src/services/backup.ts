import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { SCHEMA_VERSION, loadState, type GameState, SELFIE_FILE } from '@/game';

import { selfieUri } from './selfies';

export const BACKUP_FORMAT = 'youchi-backup';
export const BACKUP_VERSION = 1;

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: number;
  schemaVersion: number;
  exportedAt: string;
  state: GameState;
  /** Progress photos keyed by file name, JPEG base64. */
  photos: Record<string, string>;
}

/** Writes a backup JSON (game state plus progress photos) and opens the share sheet. */
export async function exportBackup(state: GameState): Promise<'shared' | 'unavailable'> {
  const photos: Record<string, string> = {};
  for (const s of state.selfies) {
    try {
      const f = new File(selfieUri(s.file));
      if (f.exists) photos[s.file] = f.base64Sync();
    } catch {
      // Skip unreadable photos rather than fail the whole backup.
    }
  }
  const payload: BackupFile = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    state,
    photos,
  };
  const stamp = new Date().toISOString().slice(0, 10);
  const file = new File(Paths.cache, `youchi-backup-${stamp}.json`);
  try {
    file.create({ overwrite: true, intermediates: true });
  } catch {
    // write() creates when needed
  }
  file.write(JSON.stringify(payload));
  if (!(await Sharing.isAvailableAsync())) return 'unavailable';
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: 'Save your YOUCHI backup' });
  return 'shared';
}

export type ImportResult = { kind: 'canceled' } | { kind: 'invalid'; reason: string } | { kind: 'ok'; state: GameState; photos: number };

/** Lets the user pick a backup file, validates it and restores its photos. */
export async function importBackup(): Promise<ImportResult> {
  const picked = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true, multiple: false });
  if (picked.canceled || !picked.assets?.[0]) return { kind: 'canceled' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(new File(picked.assets[0].uri).textSync());
  } catch {
    return { kind: 'invalid', reason: 'That file is not a YOUCHI backup.' };
  }
  const data = parsed as Partial<BackupFile> | null;
  if (!data || typeof data !== 'object' || data.format !== BACKUP_FORMAT || !data.state) {
    return { kind: 'invalid', reason: 'That file is not a YOUCHI backup.' };
  }
  if (typeof data.schemaVersion === 'number' && data.schemaVersion > SCHEMA_VERSION) {
    return { kind: 'invalid', reason: 'This backup was made by a newer version of YOUCHI. Update the app, then try again.' };
  }
  const outcome = loadState(data.state);
  if (outcome.kind !== 'ok') return { kind: 'invalid', reason: 'The backup could not be read.' };
  let photos = 0;
  const dir = new Directory(Paths.document, 'selfies');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  const entries = data.photos && typeof data.photos === 'object' ? Object.entries(data.photos) : [];
  const kept = new Set<string>();
  for (const [name, base64] of entries) {
    if (typeof base64 !== 'string' || !SELFIE_FILE.test(name)) continue;
    try {
      const f = new File(dir, name);
      try {
        f.create({ overwrite: true });
      } catch {
        // write() creates when needed
      }
      f.write(base64, { encoding: 'base64' });
      kept.add(name);
      photos += 1;
    } catch {
      // Skip a single bad photo.
    }
  }
  // Drop selfie records whose photo did not come with the backup.
  const state: GameState = { ...outcome.state, selfies: outcome.state.selfies.filter((s) => kept.has(s.file)) };
  return { kind: 'ok', state, photos };
}
