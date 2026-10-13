import { Camera, Trash2 } from 'lucide-react-native';
import React from 'react';
import { Alert, Image, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { useHaptics } from '@/hooks/useHaptics';
import { now } from '@/hooks/useNow';
import { useSelfie } from '@/hooks/useSelfie';
import { deleteSelfie, selfieUri } from '@/services/selfies';
import { useGame } from '@/state/GameProvider';
import { Button, Card, Screen, SectionHeading, Text, useToast } from '@/ui/components';
import { colors, radius, spacing } from '@/ui/theme';

function formatDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Your progress selfies, oldest to newest, with a first-vs-latest comparison. */
export default function Progress() {
  const { state, dispatch } = useGame();
  const toast = useToast();
  const haptic = useHaptics();
  const selfie = useSelfie();
  const { width } = useWindowDimensions();
  const selfies = state.selfies;
  const first = selfies[0];
  const latest = selfies[selfies.length - 1];
  const tile = (width - spacing.screen * 2 - spacing.sm * 2) / 3;

  const remove = (date: string, file: string) => {
    const doIt = async () => {
      dispatch({ type: 'removeSelfie', date, now: now() });
      await deleteSelfie(file);
      haptic('select');
      toast('Photo removed.');
    };
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.('Remove this photo?')) doIt();
      return;
    }
    Alert.alert('Remove this photo?', 'It is deleted from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: doIt },
    ]);
  };

  return (
    <Screen title="Your progress" subtitle={selfies.length ? `${selfies.length} ${selfies.length === 1 ? 'photo' : 'photos'} · private to this device` : 'Private to this device'} back>
      {selfies.length === 0 ? (
        <Card style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Camera size={28} color={colors.bonus} strokeWidth={2.2} />
          </View>
          <Text variant="subheading" align="center">
            No photos yet
          </Text>
          <Text variant="small" tone="soft" align="center">
            One upper-body photo a day, head to waist, in the same spot and light. Over weeks they add up to a record you can actually see. Each one earns 20 XP and 4 coins.
          </Text>
          <Button label="Take today's photo" icon={<Camera size={18} color={colors.surface} />} loading={selfie.busy} onPress={selfie.start} />
        </Card>
      ) : (
        <>
          {selfies.length >= 2 && first && latest ? (
            <Card style={styles.compare}>
              <View style={styles.compareCol}>
                <Image source={{ uri: selfieUri(first.file) }} style={styles.compareImage} accessibilityLabel={`First photo, ${formatDate(first.date)}`} />
                <Text variant="caption" tone="muted" align="center">
                  FIRST · {formatDate(first.date).toUpperCase()}
                </Text>
              </View>
              <View style={styles.compareCol}>
                <Image source={{ uri: selfieUri(latest.file) }} style={styles.compareImage} accessibilityLabel={`Latest photo, ${formatDate(latest.date)}`} />
                <Text variant="caption" tone="muted" align="center">
                  LATEST · {formatDate(latest.date).toUpperCase()}
                </Text>
              </View>
            </Card>
          ) : null}
          <Button
            label={state.today.selfieDone ? "Retake today's photo" : "Take today's photo"}
            variant={state.today.selfieDone ? 'secondary' : 'primary'}
            full
            icon={<Camera size={18} color={state.today.selfieDone ? colors.ink : colors.surface} />}
            loading={selfie.busy}
            onPress={selfie.start}
          />
          <SectionHeading title="All photos" />
          <View style={styles.grid}>
            {[...selfies].reverse().map((s) => (
              <View key={s.date} style={{ width: tile }}>
                <Image source={{ uri: selfieUri(s.file) }} style={[styles.thumb, { width: tile, height: Math.round((tile * 4) / 3) }]} accessibilityLabel={`Photo from ${formatDate(s.date)}`} />
                <View style={styles.thumbRow}>
                  <Text variant="caption" tone="muted" numberOfLines={1} style={{ flex: 1 }}>
                    {formatDate(s.date).toUpperCase()}
                  </Text>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Remove photo from ${formatDate(s.date)}`} hitSlop={10} onPress={() => remove(s.date, s.file)}>
                    <Trash2 size={14} color={colors.inkFaint} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
      <Text variant="small" tone="muted" align="center">
        Tip: same spot, same distance, same time of day makes the comparison honest. Photos are stored only on this device and are never part of the share card.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  emptyIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: colors.bonusSoft, alignItems: 'center', justifyContent: 'center' },
  compare: { flexDirection: 'row', gap: spacing.md },
  compareCol: { flex: 1, gap: 6 },
  compareImage: { width: '100%', aspectRatio: 3 / 4, borderRadius: radius.md, backgroundColor: colors.surfaceSunken },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  thumb: { borderRadius: radius.sm, backgroundColor: colors.surfaceSunken },
  thumbRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
});
