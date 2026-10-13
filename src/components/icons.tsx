import { Check, Coins, Droplet, Dumbbell, Lock, Sparkles, Utensils, Zap } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { GoalId } from '@/game';
import { colors, radius } from '@/ui/theme';

export type TileKind = GoalId | 'bonus';

const tilePalette: Record<TileKind, { bg: string; fg: string }> = {
  water: { bg: colors.waterSoft, fg: colors.water },
  movement: { bg: colors.moveSoft, fg: colors.move },
  eating: { bg: colors.eatSoft, fg: colors.eat },
  bonus: { bg: colors.bonusSoft, fg: colors.bonus },
};

export function GoalIcon({ kind, size = 24, color }: { kind: TileKind; size?: number; color?: string }) {
  const fg = color ?? tilePalette[kind].fg;
  switch (kind) {
    case 'water':
      return <Droplet size={size} color={fg} strokeWidth={2.2} />;
    case 'movement':
      return <Dumbbell size={size} color={fg} strokeWidth={2.2} />;
    case 'eating':
      return <Utensils size={size} color={fg} strokeWidth={2.2} />;
    case 'bonus':
      return <Zap size={size} color={fg} strokeWidth={2.2} />;
  }
}

/** A coloured square tile with a goal icon. `done` swaps in a check mark. */
export function GoalTile({ kind, done, size = 48 }: { kind: TileKind; done?: boolean; size?: number }) {
  const p = tilePalette[kind];
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, backgroundColor: done ? colors.ink : p.bg, borderRadius: size * 0.32 },
      ]}
    >
      {done ? <Check size={size * 0.5} color={colors.surface} strokeWidth={3} /> : <GoalIcon kind={kind} size={size * 0.5} />}
    </View>
  );
}

export function CoinIcon({ size = 18, color = colors.coin }: { size?: number; color?: string }) {
  return <Coins size={size} color={color} strokeWidth={2.4} />;
}

export function SparkIcon({ size = 18, color = colors.bonus }: { size?: number; color?: string }) {
  return <Sparkles size={size} color={color} strokeWidth={2.2} />;
}

export function LockIcon({ size = 16, color = colors.inkMuted }: { size?: number; color?: string }) {
  return <Lock size={size} color={color} strokeWidth={2.2} />;
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
});
