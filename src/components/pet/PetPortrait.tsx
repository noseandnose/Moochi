import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { GearId, HabitPath, PetId, StageId } from '@/game';
import { colors } from '@/ui/theme';

import { PetSprite } from './PetSprite';

/** A static (non-animated) pet picture for cards and lists. */
export function PetPortrait({
  petId,
  stage,
  path = 'balanced',
  gear = 'none',
  size = 96,
  eyes = 'open' as const,
  background = colors.surfaceMuted,
  radius = 20,
}: {
  petId: PetId;
  stage: StageId;
  path?: HabitPath;
  gear?: GearId;
  size?: number;
  eyes?: 'open' | 'happy';
  background?: string;
  radius?: number;
}) {
  return (
    <View style={[styles.wrap, { width: size, height: size, backgroundColor: background, borderRadius: radius }]} pointerEvents="none">
      <PetSprite petId={petId} stage={stage} path={path} gear={gear} size={size} animate={false} staticEyes={eyes} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
});
