import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

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

/** Longest edge kept for a stored photo: plenty for a 3:4 progress shot, small enough to back up. */
const MAX_EDGE = 1200;

export function selfieUri(file: string): string {
  return new File(selfieDirectory(), file).uri;
}

/**
 * Downscales a picked image and stores it as a JPEG in the selfies directory.
 * A camera original is several megabytes; the stored copy is a few hundred
 * kilobytes, which keeps the gallery quick and backups within memory.
 */
export async function saveSelfie(sourceUri: string, date: string): Promise<string> {
  const name = `${date}-${Date.now()}.jpg`;
  const dest = new File(selfieDirectory(), name);
  try {
    const context = ImageManipulator.manipulate(sourceUri);
    const image = await context.renderAsync();
    const { width, height } = image;
    const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
    const sized = scale < 1 ? await context.resize({ width: Math.round(width * scale), height: Math.round(height * scale) }).renderAsync() : image;
    const result = await sized.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
    new File(result.uri).move(dest);
    image.release();
    if (sized !== image) sized.release();
  } catch {
    // Fall back to the original bytes rather than losing the photo.
    new File(sourceUri).copy(dest);
  }
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

/** Removes every stored photo (used by Reset all progress). */
export async function deleteAllSelfies(): Promise<void> {
  try {
    const dir = new Directory(Paths.document, 'selfies');
    if (dir.exists) dir.delete();
  } catch {
    // Best effort.
  }
}
