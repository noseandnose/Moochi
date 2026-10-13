import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';

import { useHaptics } from '@/hooks/useHaptics';
import { now } from '@/hooks/useNow';
import { useCelebration } from '@/state/CelebrationProvider';
import { useGame } from '@/state/GameProvider';
import { saveSelfie } from '@/services/selfies';
import { useToast } from '@/ui/components';

type Source = 'camera' | 'library';

/** Takes or picks a progress selfie, stores it privately and records the bonus. */
export function useSelfie() {
  const { state, dispatch } = useGame();
  const { queue } = useCelebration();
  const toast = useToast();
  const haptic = useHaptics();
  const [busy, setBusy] = useState(false);

  const capture = useCallback(
    async (source: Source) => {
      setBusy(true);
      try {
        const permission = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          toast(source === 'camera' ? 'Allow camera access to take a selfie.' : 'Allow photo access to pick a selfie.', 'danger');
          return;
        }
        const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [1, 1], cameraType: ImagePicker.CameraType.front };
        const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
        if (result.canceled || !result.assets?.[0]?.uri) return;
        const file = await saveSelfie(result.assets[0].uri, state.today.date);
        const events = dispatch({ type: 'recordSelfie', file, now: now() });
        const error = events.find((e) => e.type === 'error');
        if (error?.type === 'error') {
          toast(error.message, 'danger');
          return;
        }
        if (events.some((e) => e.type === 'reward')) {
          queue(events);
          haptic('success');
        } else {
          haptic('tap');
          toast("Today's selfie updated.");
        }
      } catch {
        toast('Could not save the photo. Try again.', 'danger');
      } finally {
        setBusy(false);
      }
    },
    [dispatch, queue, haptic, toast, state.today.date],
  );

  /** Asks camera or library, then captures. On web only the library is offered. */
  const start = useCallback(() => {
    if (Platform.OS === 'web') {
      capture('library');
      return;
    }
    Alert.alert('Progress selfie', 'Photos stay on this device and never leave it.', [
      { text: 'Take photo', onPress: () => capture('camera') },
      { text: 'Choose from library', onPress: () => capture('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [capture]);

  return { start, capture, busy };
}
