import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PetPortrait } from '@/components/pet/PetPortrait';
import { PATHS, PETS, PET_BY_ID, getHabitPath, getStageIndex, PATH_STAGE_MIN, type PetId } from '@/game';
import { useGameState } from '@/state/GameProvider';
import { Card, Screen, Segmented, Text } from '@/ui/components';
import { colors, spacing } from '@/ui/theme';

/** Preview of all four habit paths for any pet. Never touches real progress. */
export function EvolutionPathsScreen() {
  const state = useGameState();
  const [petId, setPetId] = useState<PetId>(state.profile.petId);
  const currentPath = getHabitPath(state);
  const unlocked = getStageIndex(state) >= PATH_STAGE_MIN;
  const counts = state.progress.habitCounts;
  return (
    <Screen title="Evolution paths" subtitle="The shape of your habits" back>
      <Text variant="body" tone="soft">
        From the teen stage onward, the habit you complete most often shapes your pet. A tie keeps the Balanced look. Previews here never change your progress.
      </Text>
      <Segmented<PetId> label="Preview a pet" value={petId} onChange={setPetId} options={PETS.map((p) => ({ value: p.id, label: p.name }))} />
      <View style={styles.grid}>
        {PATHS.map((path) => {
          const isCurrent = path.id === currentPath && petId === state.profile.petId;
          return (
            <Card key={path.id} style={[styles.card, isCurrent && styles.current]} accessible accessibilityLabel={`${PET_BY_ID[petId].name}, ${path.name} path. ${path.blurb}${isCurrent ? ' Your current path.' : ''}`}>
              <PetPortrait petId={petId} stage="adult" path={path.id} size={132} background={isCurrent ? colors.sageSoft : colors.surfaceMuted} />
              <Text variant="subheading" align="center">
                {path.name}
              </Text>
              <Text variant="small" tone="soft" align="center">
                {path.blurb}
              </Text>
              {isCurrent ? (
                <Text variant="caption" tone="sage" align="center">
                  {unlocked ? 'YOUR CURRENT PATH' : 'YOUR PATH FROM TEEN'}
                </Text>
              ) : null}
            </Card>
          );
        })}
      </View>
      <Card tone="muted" elevated={false}>
        <Text variant="smallStrong">Your habit record</Text>
        <Text variant="small" tone="soft">
          Water {counts.water} · Movement {counts.movement} · Eating {counts.eating} days rewarded. Undo never changes these counts.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  card: { flexBasis: '47%', flexGrow: 1, alignItems: 'center', gap: spacing.sm },
  current: { borderColor: colors.sage },
});
