import React, { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radius, spacing, touch } from '../theme';
import { Text } from './Text';

export interface FieldProps extends TextInputProps {
  label: string;
  hint?: string;
  error?: string | null;
  suffix?: string;
}

export function Field({ label, hint, error, suffix, style, ...rest }: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      <Text variant="smallStrong" tone="soft" style={styles.label}>
        {label}
      </Text>
      <View
        style={[
          styles.inputWrap,
          focused && { borderColor: colors.ink },
          error ? { borderColor: colors.danger } : null,
        ]}
      >
        <TextInput
          accessibilityLabel={label}
          accessibilityHint={hint}
          placeholderTextColor={colors.inkFaint}
          maxFontSizeMultiplier={1.4}
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[styles.input, style]}
        />
        {suffix ? (
          <Text variant="smallStrong" tone="muted" style={styles.suffix}>
            {suffix}
          </Text>
        ) : null}
      </View>
      {error ? (
        <Text variant="small" tone="danger" accessibilityLiveRegion="polite" style={styles.hint}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="small" tone="muted" style={styles.hint}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { marginLeft: 2 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: touch.min + 4,
  },
  input: { flex: 1, fontSize: 17, color: colors.ink, paddingVertical: 10 },
  suffix: { marginLeft: 8 },
  hint: { marginLeft: 2 },
});
