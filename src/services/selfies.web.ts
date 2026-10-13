/** Web preview: the picked image (a blob or data URL) is referenced directly. */
export function selfieUri(file: string): string {
  return file;
}

export async function saveSelfie(sourceUri: string, _date: string): Promise<string> {
  return sourceUri;
}

export async function deleteSelfie(_file: string): Promise<void> {}
