import { Download, Upload } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { useHaptics } from '@/hooks/useHaptics';
import { exportBackup, importBackup } from '@/services/backup';
import { useGame } from '@/state/GameProvider';
import { Button, Card, Text, useToast } from '@/ui/components';
import { spacing } from '@/ui/theme';

/** Export the save file (with photos) and restore it on another phone. */
export function BackupSettings({ onRestored }: { onRestored?: () => void }) {
  const { state, restore } = useGame();
  const toast = useToast();
  const haptic = useHaptics();
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);

  const doExport = async () => {
    setBusy('export');
    try {
      const result = await exportBackup(state);
      if (result === 'unavailable') toast('Sharing is not available here.', 'danger');
      else haptic('success');
    } catch {
      toast('Could not create the backup.', 'danger');
    } finally {
      setBusy(null);
    }
  };

  const doImport = async () => {
    setBusy('import');
    try {
      const result = await importBackup();
      if (result.kind === 'canceled') return;
      if (result.kind === 'invalid') {
        toast(result.reason, 'danger');
        return;
      }
      const apply = () => {
        restore(result.state);
        haptic('success');
        toast(`Backup restored${result.photos ? ` with ${result.photos} ${result.photos === 1 ? 'photo' : 'photos'}` : ''}.`);
        onRestored?.();
      };
      const summary = `This replaces everything on this phone with the backup: ${result.state.profile.petName}, ${result.state.progress.xp} XP, ${result.state.progress.coins} coins.`;
      if (Platform.OS === 'web') {
        if (globalThis.confirm?.(`Restore backup? ${summary}`)) apply();
        return;
      }
      Alert.alert('Restore this backup?', summary, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restore', style: 'destructive', onPress: apply },
      ]);
    } catch {
      toast('Could not read that file.', 'danger');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card style={{ gap: spacing.md }}>
      <Text variant="small" tone="soft">
        Save a copy of your pet, progress and photos as a file, and restore it on a new phone. Keep it somewhere safe such as Files, Drive or iCloud; MOCHI has no cloud of its own.
      </Text>
      <View style={styles.row}>
        <Button label="Export backup" variant="secondary" style={styles.half} icon={<Upload size={18} />} loading={busy === 'export'} onPress={doExport} />
        <Button label="Restore backup" variant="secondary" style={styles.half} icon={<Download size={18} />} loading={busy === 'import'} onPress={doImport} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
});
