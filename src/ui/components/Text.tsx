import React from 'react';
import { Text as RNText, type TextProps as RNTextProps, StyleSheet } from 'react-native';

import { colors, type as typeTokens } from '../theme';

export type TextVariant = keyof typeof typeTokens;
export type TextTone = 'ink' | 'soft' | 'muted' | 'faint' | 'inverse' | 'sage' | 'danger' | 'water' | 'move' | 'eat' | 'bonus';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: TextTone;
  align?: 'left' | 'center' | 'right';
}

const toneColor: Record<TextTone, string> = {
  ink: colors.ink,
  soft: colors.inkSoft,
  muted: colors.inkMuted,
  faint: colors.inkFaint,
  inverse: colors.surface,
  sage: colors.sageDeep,
  danger: colors.danger,
  water: colors.water,
  move: colors.move,
  eat: colors.eat,
  bonus: colors.bonus,
};

export function Text({ variant = 'body', tone = 'ink', align, style, ...rest }: TextProps) {
  return (
    <RNText
      {...rest}
      maxFontSizeMultiplier={rest.maxFontSizeMultiplier ?? 1.6}
      style={[styles.base, typeTokens[variant], { color: toneColor[tone] }, align ? { textAlign: align } : null, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: { fontFamily: undefined },
});
