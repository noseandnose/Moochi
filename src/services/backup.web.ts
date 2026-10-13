import { loadState, type GameState } from '@/game';

export type ImportResult = { kind: 'canceled' } | { kind: 'invalid'; reason: string } | { kind: 'ok'; state: GameState; photos: number };

/** Web preview: downloads the JSON (without photos) and reads a chosen file. */
export async function exportBackup(state: GameState): Promise<'shared' | 'unavailable'> {
  if (typeof document === 'undefined') return 'unavailable';
  const payload = { format: 'youchi-backup', version: 1, schemaVersion: state.schemaVersion, exportedAt: new Date().toISOString(), state, photos: {} };
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `youchi-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'shared';
}

export async function importBackup(): Promise<ImportResult> {
  if (typeof document === 'undefined') return { kind: 'canceled' };
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve({ kind: 'canceled' });
      try {
        const data = JSON.parse(await file.text());
        if (data?.format !== 'youchi-backup' || !data.state) return resolve({ kind: 'invalid', reason: 'That file is not a YOUchi backup.' });
        const outcome = loadState(data.state);
        if (outcome.kind !== 'ok') return resolve({ kind: 'invalid', reason: 'The backup could not be read.' });
        resolve({ kind: 'ok', state: { ...outcome.state, selfies: [] }, photos: 0 });
      } catch {
        resolve({ kind: 'invalid', reason: 'That file is not a YOUchi backup.' });
      }
    };
    input.click();
  });
}
