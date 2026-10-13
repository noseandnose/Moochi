import { Check } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PETS, type PetId } from '@/game';
import { PetPortrait } from '@/components/pet/PetPortrait';
import { Text } from '@/ui/components';
import { colors, radius, shadow, spacing } from '@/ui/theme';

export function PetChoice({ selected, onSelect }: { selected: PetId; onSelect: (id: PetId) => void }) {
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {PETS.map((pet) => {
        const isSelected = pet.id === selected;
        return (
          <Pressable
            key={pet.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected, checked: isSelected }}
            accessibilityLabel={`${pet.name}. ${pet.personality} Habitat: ${pet.habitat}.`}
            onPress={() => onSelect(pet.id)}
            style={({ pressed }) => [styles.card, isSelected && styles.selected, pressed && { opacity: 0.9 }]}
          >
            <PetPortrait petId={pet.id} stage="teen" size={112} eyes={isSelected ? 'happy' : 'open'} background={isSelected ? colors.sageSoft : colors.surfaceMuted} />
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text variant="heading">{pet.name}</Text>
                {isSelected ? (
                  <View style={styles.badge}>
                    <Check size={14} color={colors.surface} strokeWidth={3} />
                    <Text variant="caption" tone="inverse">
                      SELECTED
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text variant="small" tone="soft">
                {pet.personality}
              </Text>
              <Text variant="small" tone="muted">
                {pet.habitat} habitat
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  selected: { borderColor: colors.ink, backgroundColor: colors.surface },
  info: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.ink, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill },
});
