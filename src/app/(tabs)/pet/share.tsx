import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ImageDown, Link, Share2 } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Platform, Share, StyleSheet, View } from 'react-native';

import { ShareCard, useCanvasRef } from '@/components/share/ShareCard';
import { PATH_BY_ID, STAGES, getLevel, getStage, getVisualPath } from '@/game';
import { useHaptics } from '@/hooks/useHaptics';
import { saveImageToLibrary } from '@/services/saveImage';
import { useGameState } from '@/state/GameProvider';
import { Button, Card, Screen, Text, useToast } from '@/ui/components';
import { colors, spacing } from '@/ui/theme';

const SITE_URL = 'https://mochi-pocket-companion.waynegluckmann.chatgpt.site';

export default function SharePet() {
  const state = useGameState();
  const toast = useToast();
  const haptic = useHaptics();
  const canvas = useCanvasRef();
  const [busy, setBusy] = useState<'share' | 'save' | null>(null);
  const [ready, setReady] = useState(false);

  const stage = getStage(state);
  const level = getLevel(state);
  const stageName = STAGES.find((s) => s.id === stage)?.name ?? '';
  const path = getVisualPath(state);
  const pathName = PATH_BY_ID[path].name;
  const message = `Meet ${state.profile.petName}, my MOCHI. Level ${level} ${stageName}. Build habits. Level up. ${SITE_URL}`;

  const renderToFile = useCallback(async (): Promise<string> => {
    const image = canvas.current?.makeImageSnapshot();
    if (!image) throw new Error('Card is still preparing. Try again in a moment.');
    const base64 = image.encodeToBase64();
    const file = new File(Paths.cache, `mochi-${state.profile.petId}-${Date.now()}.png`);
    try {
      file.create({ overwrite: true, intermediates: true });
    } catch {
      // write() below creates the file when needed.
    }
    file.write(base64, { encoding: 'base64' });
    return file.uri;
  }, [canvas, state.profile.petId]);

  const share = async () => {
    setBusy('share');
    try {
      if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
        const uri = await renderToFile();
        await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: 'Share your MOCHI card' });
        haptic('success');
      } else {
        await Share.share({ message });
      }
    } catch (e) {
      const text = e instanceof Error ? e.message : '';
      if (!/cancel|dismiss/i.test(text)) toast('Sharing is unavailable here. Try saving the card or sharing a link.', 'danger');
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    setBusy('save');
    try {
      const uri = await renderToFile();
      const result = await saveImageToLibrary(uri);
      if (result === 'denied') {
        toast('Allow photo access to save your card.', 'danger');
        return;
      }
      if (result === 'unavailable') {
        toast('Saving to Photos is not available here.', 'danger');
        return;
      }
      haptic('success');
      toast('Card saved to your photos.');
    } catch {
      toast('Could not save the card. Try sharing it instead.', 'danger');
    } finally {
      setBusy(null);
    }
  };

  const shareLink = async () => {
    try {
      await Share.share({ message });
    } catch {
      toast('Sharing is unavailable right now.', 'danger');
    }
  };

  return (
    <Screen title="Share your pet" subtitle="Show your pet. Keep your habits private." back>
      <View style={styles.cardWrap} accessible accessibilityLabel={`Pet card: ${state.profile.petName}, level ${level}, ${stageName}, ${pathName} path`}>
        <ShareCard ref={canvas} petId={state.profile.petId} stage={stage} path={path} gear={state.progress.equippedGear} name={state.profile.petName} level={level} stageName={stageName} pathName={pathName} onReady={setReady} />
      </View>
      <Button label={ready ? 'Share card' : 'Preparing card…'} size="lg" full icon={<Share2 size={18} color={colors.surface} />} loading={busy === 'share'} disabled={!ready} onPress={share} />
      <View style={styles.row}>
        <Button label="Save image" variant="secondary" style={styles.half} icon={<ImageDown size={18} color={colors.ink} />} loading={busy === 'save'} disabled={!ready} onPress={save} />
        <Button label="Share link" variant="secondary" style={styles.half} icon={<Link size={18} color={colors.ink} />} onPress={shareLink} />
      </View>
      <Card tone="muted" elevated={false}>
        <Text variant="small" tone="soft">
          The card shows your pet, its name, level, stage and evolution path. Your water log, eating goal, gender and other settings are never included.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardWrap: { alignItems: 'center', marginVertical: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
});
