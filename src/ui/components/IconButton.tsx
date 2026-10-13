import React from 'react';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { colors, radius, touch } from '../theme';

export interface IconButtonProps extends Omit<PressableProps, 'children'> {
  children: React.ReactNode;
  label: string;
  tone?: 'plain' | 'surface';
}

export function IconButton({ children, label, tone = 'surface', style, ...rest }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      {...rest}
      style={(s) => [
        styles.base,
        tone === 'surface' && styles.surface,
        s.pressed && { opacity: 0.7 },
        typeof style === 'function' ? style(s) : style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { width: touch.min, height: touch.min, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  surface: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
});
