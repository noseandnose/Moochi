/** Only Android can ask the launcher to place a widget. */
export const canPinWidget = false;

export async function pinWidget(): Promise<boolean> {
  return false;
}
