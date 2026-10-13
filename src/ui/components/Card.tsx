import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors, radius, shadow, spacing } from '../theme';

export interface CardProps extends ViewProps {
  tone?: 'surface' | 'muted' | 'sunken' | 'ink';
  padded?: boolean;
  elevated?: boolean;
}

export function Card({ tone = 'surface', padded = true, elevated = true, style, ...rest }: CardProps) {
  return (
    <View
      {...rest}
      style={[
        styles.base,
        tone === 'surface' && { backgroundColor: colors.surface, borderColor: colors.line },
        tone === 'muted' && { backgroundColor: colors.surfaceMuted, borderColor: colors.surfaceMuted },
        tone === 'sunken' && { backgroundColor: colors.surfaceSunken, borderColor: colors.surfaceSunken },
        tone === 'ink' && { backgroundColor: colors.ink, borderColor: colors.ink },
        padded && styles.padded,
        elevated && tone === 'surface' && shadow.card,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.lg, borderWidth: 1, overflow: 'visible' },
  padded: { padding: spacing.lg },
});
