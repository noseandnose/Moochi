import { X } from 'lucide-react-native';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { useBack } from '@/hooks/useBack';
import { useHaptics } from '@/hooks/useHaptics';
import { canPinWidget, pinWidget } from '@/services/widgetPin';
import { useGame } from '@/state/GameProvider';
import { Button, Card, IconButton, Screen, Text, useToast } from '@/ui/components';
import { colors, spacing } from '@/ui/theme';

const IOS_STEPS = [
  'Touch and hold an empty spot on your home screen until the apps wiggle.',
  'Tap the + (or Edit, then Add Widget) in the top corner.',
  'Search for YOUCHI and pick the small widget (just your pet) or the medium one (pet plus the three goal buttons).',
  'Tap Add Widget, then Done.',
];

const ANDROID_STEPS = [
  'Touch and hold an empty spot on your home screen.',
  'Tap Widgets.',
  'Find YOUCHI and drag the widget onto the screen. Resize it wider to show the three goal buttons.',
];

export default function WidgetHowTo() {
  const back = useBack();
  const { state, dispatch } = useGame();
  const toast = useToast();
  const haptic = useHaptics();
  const pet = state.profile.petName;
  const steps = Platform.OS === 'android' ? ANDROID_STEPS : IOS_STEPS;

  const addDirect = async () => {
    haptic('select');
    const ok = await pinWidget();
    if (ok) dispatch({ type: 'updatePrefs', patch: { widgetPromptSeen: true } });
    else toast('Your launcher did not offer to add it. Use the steps below.', 'danger');
  };

  return (
    <Screen
      title="Home screen widget"
      subtitle={`${pet}, always one glance away.`}
      headerRight={
        <IconButton label="Close" onPress={back}>
          <X size={22} color={colors.ink} />
        </IconButton>
      }
    >
      <Card style={{ gap: spacing.sm }}>
        <Text variant="bodyStrong">What it shows</Text>
        <Text variant="small" tone="soft">
          The small widget is {pet} in the current mood: thirsty, hungry, restless, asleep or happy. The wider widget adds a one-line nudge and three buttons, Water, Move and Eat, that open the right screen in one tap. It updates whenever you log something.
        </Text>
      </Card>
      {canPinWidget ? <Button label="Add the widget now" full onPress={addDirect} /> : null}
      <Card style={{ gap: spacing.md }}>
        <Text variant="bodyStrong">{canPinWidget ? 'Or add it by hand' : 'How to add it'}</Text>
        {steps.map((step, i) => (
          <View key={step} style={styles.step}>
            <View style={styles.num}>
              <Text variant="smallStrong" tone="inverse">
                {i + 1}
              </Text>
            </View>
            <Text variant="small" style={{ flex: 1 }}>
              {step}
            </Text>
          </View>
        ))}
      </Card>
      <Text variant="small" tone="muted">
        The widget reads only your pet, its mood and today’s goal counts. Nothing leaves your phone.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  step: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  num: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
});
