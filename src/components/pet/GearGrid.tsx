import { Check } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CoinIcon, LockIcon } from '@/components/icons';
import { PetPortrait } from '@/components/pet/PetPortrait';
import { GEAR, type GearId, type HabitPath, type PetId, type StageId } from '@/game';
import { Text } from '@/ui/components';
import { colors, radius, shadow, spacing } from '@/ui/theme';

export interface GearGridProps {
  petId: PetId;
  stage: StageId;
  path: HabitPath;
  owned: GearId[];
  equipped: GearId;
  previewing: GearId;
  coins: number;
  onPreview: (gear: GearId) => void;
}

/** Tile label stays short (a word or the price) so it fits a third of the screen on any phone. */
export function gearStatus(gear: GearId, owned: GearId[], equipped: GearId, coins: number, cost: number) {
  if (equipped === gear) return { label: 'Equipped', kind: 'equipped' as const };
  if (owned.includes(gear)) return { label: 'Owned', kind: 'owned' as const };
  if (coins >= cost) return { label: `${cost}`, kind: 'unlock' as const };
  return { label: `${cost}`, kind: 'locked' as const };
}

export function GearGrid({ petId, stage, path, owned, equipped, previewing, coins, onPreview }: GearGridProps) {
  const previewStage: StageId = stage === 'egg' ? 'baby' : stage;
  return (
    <View style={styles.grid} accessibilityRole="radiogroup" accessibilityLabel="Gear. Tap to preview; previewing never spends coins.">
      {GEAR.map((item) => {
        const status = gearStatus(item.id, owned, equipped, coins, item.cost);
        const selected = previewing === item.id;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="radio"
            accessibilityState={{ selected, checked: selected }}
            accessibilityLabel={`${item.name}. ${item.cost === 0 ? 'Free' : `${item.cost} coins`}. ${status.kind === 'locked' ? `${item.cost - coins} more coins needed` : status.kind === 'unlock' ? 'You can unlock this' : status.label}.`}
            accessibilityHint="Previews this gear on your pet"
            onPress={() => onPreview(item.id)}
            style={({ pressed }) => [styles.card, selected && styles.selected, pressed && { opacity: 0.85 }]}
          >
            <PetPortrait petId={petId} stage={previewStage} path={path} gear={item.id} size={84} background={selected ? colors.sageSoft : colors.surfaceMuted} radius={16} />
            <Text variant="smallStrong" align="center">
              {item.name}
            </Text>
            <View style={styles.statusRow}>
              {status.kind === 'equipped' ? <Check size={13} color={colors.success} strokeWidth={3} /> : null}
              {status.kind === 'locked' || status.kind === 'unlock' ? <CoinIcon size={13} /> : null}
              {status.kind === 'locked' ? <LockIcon size={11} /> : null}
              <Text variant="caption" tone={status.kind === 'equipped' ? 'sage' : status.kind === 'locked' ? 'muted' : 'ink'} numberOfLines={1}>
                {status.label.toUpperCase()}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  card: {
    flexBasis: '30%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 6,
    padding: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.line,
    ...shadow.card,
  },
  selected: { borderColor: colors.ink },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
