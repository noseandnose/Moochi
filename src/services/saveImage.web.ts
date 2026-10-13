export type SaveResult = 'saved' | 'denied' | 'unavailable';

/** The web preview has no photo library; the share sheet or a download is used instead. */
export async function saveImageToLibrary(_uri: string): Promise<SaveResult> {
  return 'unavailable';
}
