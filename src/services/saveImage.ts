import * as MediaLibrary from 'expo-media-library';

export type SaveResult = 'saved' | 'denied' | 'unavailable';

/** Saves a local PNG file to the device photo library (native only). */
export async function saveImageToLibrary(uri: string): Promise<SaveResult> {
  const permission = await MediaLibrary.requestPermissionsAsync(true, ['photo']);
  if (!permission.granted) return 'denied';
  await MediaLibrary.Asset.create(uri);
  return 'saved';
}
