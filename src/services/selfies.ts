import { Directory, File, Paths } from 'expo-file-system';

/**
 * Progress selfies live in the app's private document directory. Only the
 * file name is stored in game state because the directory path can change
 * between app updates on iOS.
 */
function selfieDirectory(): Directory {
  const dir = new Directory(Paths.document, 'selfies');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

export function selfieUri(file: string): string {
  return new File(selfieDirectory(), file).uri;
}

/** Copies a picked image into the selfies directory and returns its file name. */
export async function saveSelfie(sourceUri: string, date: string): Promise<string> {
  const name = `${date}-${Date.now()}.jpg`;
  const dest = new File(selfieDirectory(), name);
  const source = new File(sourceUri);
  source.copy(dest);
  return name;
}

export async function deleteSelfie(file: string): Promise<void> {
  try {
    const f = new File(selfieDirectory(), file);
    if (f.exists) f.delete();
  } catch {
    // Already gone.
  }
}
