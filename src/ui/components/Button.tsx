import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, touch } from '../theme';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft';
export type ButtonSize = 'md' | 'lg' | 'sm';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  full?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, variant = 'primary', size = 'md', icon, iconRight, loading, full, style, disabled, ...rest }: ButtonProps) {
  const palette = palettes[variant];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rest.accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!isDisabled }}
      disabled={isDisabled}
      hitSlop={6}
      {...rest}
      style={({ pressed }) => [
        styles.base,
        sizes[size],
        { backgroundColor: palette.bg, borderColor: palette.border },
        full && styles.full,
        pressed && !isDisabled && { opacity: 0.85, transform: [{ scale: 0.985 }] },
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <Text variant={size === 'sm' ? 'smallStrong' : 'bodyStrong'} style={{ color: palette.fg }} numberOfLines={1}>
            {label}
          </Text>
          {iconRight ? <View style={styles.icon}>{iconRight}</View> : null}
        </View>
      )}
    </Pressable>
  );
}

const palettes: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.ink, fg: colors.surface, border: colors.ink },
  secondary: { bg: colors.surface, fg: colors.ink, border: colors.lineStrong },
  soft: { bg: colors.sageSoft, fg: colors.sageDeep, border: colors.sageSoft },
  ghost: { bg: 'transparent', fg: colors.inkSoft, border: 'transparent' },
  danger: { bg: colors.dangerSoft, fg: colors.danger, border: colors.dangerSoft },
};

const sizes: Record<ButtonSize, ViewStyle> = {
  sm: { minHeight: 40, paddingHorizontal: 14 },
  md: { minHeight: touch.min, paddingHorizontal: 18 },
  lg: { minHeight: 56, paddingHorizontal: 22 },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  full: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.45 },
});
