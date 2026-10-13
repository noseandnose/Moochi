import { useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';

/**
 * Leaves the current screen: pops when there is history, otherwise replaces
 * with `fallback` so a screen opened from a deep link (widget, notification)
 * still has somewhere to go.
 */
export function useBack(fallback: Href = '/(tabs)/today') {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(fallback);
  }, [router, fallback]);
}
