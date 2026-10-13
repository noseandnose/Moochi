import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, touch } from '../theme';
import { Text } from './Text';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <View style={styles.wrap}>
      <Text variant="smallStrong" tone="soft" style={styles.label}>
        {label}
      </Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.track}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ selected, checked: selected }}
              accessibilityLabel={o.label}
              onPress={() => onChange(o.value)}
              style={[styles.option, selected && styles.selected]}
            >
              <Text variant="smallStrong" tone={selected ? 'inverse' : 'soft'}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { marginLeft: 2 },
  track: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  option: {
    flex: 1,
    minHeight: touch.min - 8,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  selected: { backgroundColor: colors.ink },
});
