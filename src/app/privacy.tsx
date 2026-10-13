import { X } from 'lucide-react-native';
import React from 'react';

import { useBack } from '@/hooks/useBack';
import { Card, IconButton, Screen, Text } from '@/ui/components';
import { colors, spacing } from '@/ui/theme';

const SECTIONS: { title: string; body: string }[] = [
  {
    title: 'What stays on your phone',
    body: 'Your pet, goals, daily check-ins, XP, coins, gear, progress photos and settings. YOUchi has no accounts, no servers and no analytics. Nothing is uploaded.',
  },
  {
    title: 'Health data',
    body: 'With health sync on, YOUchi reads today’s steps and workouts from Apple Health or Health Connect to complete your movement goal. It only reads, never writes, keeps nothing beyond today, and never shares it. Turn it off any time in Settings.',
  },
  {
    title: 'Photos',
    body: 'Progress photos are taken only when you tap the button and are stored in the app’s private folder. They never appear on share cards and are deleted when you remove them or uninstall the app.',
  },
  {
    title: 'Widget, sharing and backups',
    body: 'The widget shows your pet, level and today’s goal counts only. Share cards and backup files are created only when you ask and go only where you send them. A backup includes your photos, so treat it as private.',
  },
  {
    title: 'Deleting your data',
    body: 'Settings → Reset all progress, or uninstall the app. Both remove everything.',
  },
];

export default function Privacy() {
  const back = useBack();
  return (
    <Screen
      title="Privacy"
      subtitle="Short version: everything stays on your phone."
      headerRight={
        <IconButton label="Close" onPress={back}>
          <X size={22} color={colors.ink} />
        </IconButton>
      }
    >
      {SECTIONS.map((s) => (
        <Card key={s.title} style={{ gap: spacing.xs }}>
          <Text variant="subheading">{s.title}</Text>
          <Text variant="small" tone="soft">
            {s.body}
          </Text>
        </Card>
      ))}
      <Text variant="small" tone="muted" align="center">
        The full policy ships in the repository as docs/PRIVACY.md and should be published at the URL listed in the app stores.
      </Text>
    </Screen>
  );
}
