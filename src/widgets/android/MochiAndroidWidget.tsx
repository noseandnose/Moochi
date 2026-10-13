import React from 'react';
import { FlexWidget, ImageWidget, TextWidget } from 'react-native-android-widget';

import type { WidgetSnapshot } from '@/services/widgetSnapshot';

export interface AndroidWidgetData extends WidgetSnapshot {
  /** data:image/png;base64 */
  petImage: string | null;
}

const ink = '#20231F';
const muted = '#767B72';
const sage = '#5F7A62';

/** Android home screen widget, rendered to RemoteViews by react-native-android-widget. */
export function MochiAndroidWidget({ data, width }: { data: AndroidWidgetData | null; width: number }) {
  const compact = width < 220;
  if (!data) {
    return (
      <FlexWidget style={{ height: 'match_parent', width: 'match_parent', backgroundColor: '#FAF9F6', borderRadius: 20, padding: 14, justifyContent: 'center' }} clickAction="OPEN_APP">
        <TextWidget text="MOCHI" style={{ fontSize: 16, fontWeight: 'bold', color: ink }} />
        <TextWidget text="Open the app to start." style={{ fontSize: 12, color: muted }} />
      </FlexWidget>
    );
  }
  const summary = data.isEgg ? 'Complete goals to hatch' : `${data.xpToNext} XP to ${data.nextStageName}`;
  const image = data.petImage ? <ImageWidget image={data.petImage as `data:image${string}`} imageWidth={compact ? 56 : 88} imageHeight={compact ? 56 : 88} /> : null;
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{ height: 'match_parent', width: 'match_parent', backgroundColor: '#FAF9F6', borderRadius: 20, padding: 14, flexDirection: 'row', alignItems: 'center' }}
    >
      {image}
      <FlexWidget style={{ flex: 1, flexDirection: 'column', marginLeft: 12 }}>
        <TextWidget text={data.petName} style={{ fontSize: compact ? 15 : 18, fontWeight: 'bold', color: ink }} maxLines={1} />
        <TextWidget text={`${data.stageName} · Level ${data.level}`} style={{ fontSize: 12, color: muted }} maxLines={1} />
        <TextWidget text={`${data.completed}/3 daily goals`} style={{ fontSize: compact ? 18 : 22, fontWeight: 'bold', color: data.completed === 3 ? sage : ink }} maxLines={1} />
        <TextWidget text={compact ? summary : `${data.bonus}/3 bonus · ${summary}`} style={{ fontSize: 12, color: muted }} maxLines={1} />
      </FlexWidget>
    </FlexWidget>
  );
}
