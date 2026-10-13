import { Camera, Check, ChevronRight, Pencil } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { GoalTile } from '@/components/icons';
import { BONUSES, type BonusId } from '@/game';
import { Button, Text } from '@/ui/components';
import { colors, radius, shadow, spacing } from '@/ui/theme';

export interface BonusTile {
  id: BonusId;
  title: string;
  detail: string;
  done: boolean;
  /** Primary action label when not done (e.g. "Take selfie", "Done", "Set goal"). */
  actionLabel: string;
  onAction: () => void;
  onOpen: () => void;
  /** Thumbnail for the selfie tile once taken. */
  imageUri?: string;
  /** True when the tile needs setup before it can be completed. */
  needsSetup?: boolean;
}

/**
 * Three bonus tiles in a paged, swipeable row: progress selfie, daily
 * challenge, custom goal. Each earns 20 XP and 4 coins once per day.
 */
export function BonusCarousel({ tiles, doneCount }: { tiles: BonusTile[]; doneCount: number }) {
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(1);
  const scroller = useRef<ScrollView>(null);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  };
  const goTo = (i: number) => {
    scroller.current?.scrollTo({ x: i * width, animated: true });
    setPage(i);
  };
  return (
    <View style={styles.wrap} onLayout={onLayout}>
      <View style={styles.header}>
        <Text variant="smallStrong" tone="soft">
          Bonus · {doneCount}/3 · 20 XP each
        </Text>
        <View style={styles.dots} accessibilityRole="tablist">
          {tiles.map((t, i) => (
            <Pressable
              key={t.id}
              accessibilityRole="tab"
              accessibilityLabel={`${BONUSES[i].title}${t.done ? ', done' : ''}`}
              accessibilityState={{ selected: page === i }}
              hitSlop={8}
              onPress={() => goTo(i)}
              style={[styles.dot, page === i && styles.dotActive, t.done && styles.dotDone]}
            />
          ))}
        </View>
      </View>
      {width > 0 ? (
        <ScrollView
          ref={scroller}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          onScrollEndDrag={onScrollEnd}
          contentOffset={{ x: width, y: 0 }}
          snapToInterval={width}
          decelerationRate="fast"
          accessibilityLabel="Bonus goals, swipe to see all three"
        >
          {tiles.map((tile) => (
            <View key={tile.id} style={{ width }}>
              <BonusCard tile={tile} />
            </View>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

function BonusCard({ tile }: { tile: BonusTile }) {
  const icon = tile.id === 'selfie' ? <Camera size={20} color={colors.bonus} strokeWidth={2.2} /> : tile.id === 'custom' ? <Pencil size={20} color={colors.bonus} strokeWidth={2.2} /> : null;
  return (
    <View style={[styles.card, tile.done && styles.cardDone]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${tile.title}. ${tile.detail}. ${tile.done ? 'Done today.' : 'Not done yet.'}`}
        accessibilityHint="Opens details"
        onPress={tile.onOpen}
        style={({ pressed }) => [styles.body, pressed && { opacity: 0.8 }]}
      >
        {tile.imageUri ? (
          <Image source={{ uri: tile.imageUri }} style={styles.thumb} accessibilityIgnoresInvertColors />
        ) : icon && !tile.done ? (
          <View style={styles.iconTile}>{icon}</View>
        ) : (
          <GoalTile kind="bonus" done={tile.done} size={40} />
        )}
        <View style={styles.text}>
          <View style={styles.titleRow}>
            <Text variant="bodyStrong" numberOfLines={1} style={styles.title}>
              {tile.title}
            </Text>
            <Text variant="caption" tone="muted">
              BONUS
            </Text>
          </View>
          {tile.done ? (
            <View style={styles.doneRow}>
              <Check size={13} color={colors.success} strokeWidth={3} />
              <Text variant="small" tone="sage" numberOfLines={1}>
                Done today
              </Text>
            </View>
          ) : (
            <Text variant="small" tone="soft" numberOfLines={1}>
              {tile.detail}
            </Text>
          )}
        </View>
      </Pressable>
      {tile.done ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Open ${tile.title}`} onPress={tile.onOpen} hitSlop={8} style={styles.chevron}>
          <ChevronRight size={20} color={colors.inkFaint} />
        </Pressable>
      ) : (
        <Button label={tile.actionLabel} size="sm" variant={tile.needsSetup ? 'secondary' : 'primary'} onPress={tile.onAction} accessibilityLabel={`${tile.actionLabel}: ${tile.title}`} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.lineStrong },
  dotActive: { width: 18, backgroundColor: colors.ink },
  dotDone: { backgroundColor: colors.success },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 10,
    paddingHorizontal: 10,
    minHeight: 62,
    ...shadow.card,
  },
  cardDone: { backgroundColor: colors.surfaceMuted, borderColor: colors.surfaceMuted, shadowOpacity: 0, elevation: 0 },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconTile: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.bonusSoft, alignItems: 'center', justifyContent: 'center' },
  thumb: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.surfaceSunken, resizeMode: 'cover' },
  text: { flex: 1, gap: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { flexShrink: 1 },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chevron: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
