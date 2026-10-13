import { useRouter } from 'expo-router';
import { ChevronLeft, Settings } from 'lucide-react-native';
import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../theme';
import { IconButton } from './IconButton';
import { Text } from './Text';

export interface ScreenProps extends ScrollViewProps {
  title?: string;
  subtitle?: string;
  /** Show a back button that pops the stack. */
  back?: boolean;
  /** Show the settings control in the header. */
  settings?: boolean;
  headerRight?: React.ReactNode;
  /** Tab screens sit above the tab bar, which already handles the bottom inset. */
  inTabs?: boolean;
  keyboard?: boolean;
  children: React.ReactNode;
}

export function Screen({ title, subtitle, back, settings, headerRight, inTabs, keyboard, children, contentContainerStyle, ...rest }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const body = (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      {...rest}
      style={[styles.scroll, rest.style]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + (inTabs ? spacing.sm : spacing.md), paddingBottom: (inTabs ? spacing.xl : insets.bottom + spacing.xl) + spacing.lg },
        contentContainerStyle,
      ]}
    >
      {title ? (
        <View style={styles.header}>
          <View style={styles.titleRow}>
            {back ? (
              <IconButton label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
                <ChevronLeft color={colors.ink} size={24} />
              </IconButton>
            ) : null}
            <View style={styles.titles}>
              <Text variant="title" accessibilityRole="header">
                {title}
              </Text>
              {subtitle ? (
                <Text variant="small" tone="muted">
                  {subtitle}
                </Text>
              ) : null}
            </View>
          </View>
          <View style={styles.right}>
            {headerRight}
            {settings ? (
              <IconButton label="Settings" onPress={() => router.push('/settings')}>
                <Settings color={colors.ink} size={22} />
              </IconButton>
            ) : null}
          </View>
        </View>
      ) : null}
      {children}
    </ScrollView>
  );
  if (keyboard) {
    return (
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {body}
      </KeyboardAvoidingView>
    );
  }
  return body;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.screen, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm, minHeight: 48 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  titles: { flex: 1, gap: 2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});

export function SectionHeading({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View style={sectionStyles.row}>
      <Text variant="heading" accessibilityRole="header">
        {title}
      </Text>
      {action}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
});
