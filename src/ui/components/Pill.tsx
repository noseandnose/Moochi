import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors, radius } from '../theme';
import { Text } from './Text';

export interface PillProps extends ViewProps {
  label: string;
  icon?: React.ReactNode;
  tone?: 'surface' | 'ink' | 'sage' | 'coin';
}

export function Pill({ label, icon, tone = 'surface', style, ...rest }: PillProps) {
  const bg = { surface: colors.surface, ink: colors.ink, sage: colors.sageSoft, coin: colors.bonusSoft }[tone];
  const fg: 'ink' | 'inverse' | 'sage' = tone === 'ink' ? 'inverse' : tone === 'sage' ? 'sage' : 'ink';
  return (
    <View {...rest} style={[styles.pill, { backgroundColor: bg, borderColor: tone === 'surface' ? colors.line : bg }, style]}>
      {icon}
      <Text variant="smallStrong" tone={fg}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    minHeight: 34,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
