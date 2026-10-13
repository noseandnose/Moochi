import React from 'react';
import { FlexWidget, ImageWidget, SvgWidget, TextWidget } from 'react-native-android-widget';

import type { WidgetSnapshot } from '@/services/widgetSnapshot';

export interface AndroidWidgetData extends WidgetSnapshot {
  /** data:image/png;base64 */
  petImage: string | null;
}

const ink = '#20231F';
const muted = '#767B72';
const sage = '#5F7A62';
const surface = '#FFFEFA';
const line = '#E3E2DA';

/* Lucide icon paths (ISC licence) as inline SVG so they render in RemoteViews. */
const ICONS = {
  water: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  move: '<path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/><path d="m21.5 21.5-1.4-1.4"/><path d="M3.9 3.9 2.5 2.5"/><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/>',
  eat: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
} as const;

function svg(path: string, color: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

function GoalButton({ icon, label, done, uri }: { icon: keyof typeof ICONS; label: string; done: boolean; uri: string }) {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: done ? '#DCE5D9' : surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: done ? '#DCE5D9' : line,
        paddingHorizontal: 10,
        height: 34,
        width: 'match_parent',
        marginBottom: 6,
      }}
    >
      <SvgWidget svg={svg(ICONS[icon], done ? sage : ink)} style={{ width: 16, height: 16, marginRight: 8 }} />
      <FlexWidget style={{ flex: 1 }}>
        <TextWidget text={label} style={{ fontSize: 13, fontWeight: 'bold', color: done ? sage : ink }} maxLines={1} />
      </FlexWidget>
      <TextWidget text={done ? '✓' : '›'} style={{ fontSize: 14, fontWeight: 'bold', color: done ? sage : muted }} />
    </FlexWidget>
  );
}

/**
 * Android home screen widget. Narrow: the pet alone. Wide: the pet, a line
 * that says what to do next, and three buttons that deep-link into the app.
 */
export function YouchiAndroidWidget({ data, width }: { data: AndroidWidgetData | null; width: number }) {
  const wide = width >= 220;
  if (!data) {
    return (
      <FlexWidget style={{ height: 'match_parent', width: 'match_parent', backgroundColor: '#FAF9F6', borderRadius: 20, padding: 14, justifyContent: 'center' }} clickAction="OPEN_APP">
        <TextWidget text="YOUCHI" style={{ fontSize: 16, fontWeight: 'bold', color: ink }} />
        <TextWidget text="Open the app to start." style={{ fontSize: 12, color: muted }} />
      </FlexWidget>
    );
  }
  const petSize = wide ? 104 : 96;
  const image = data.petImage ? <ImageWidget image={data.petImage as `data:image${string}`} imageWidth={petSize} imageHeight={petSize} /> : null;
  if (!wide) {
    return (
      <FlexWidget clickAction="OPEN_APP" style={{ height: 'match_parent', width: 'match_parent', backgroundColor: '#FAF9F6', borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
        {image}
      </FlexWidget>
    );
  }
  return (
    <FlexWidget style={{ height: 'match_parent', width: 'match_parent', backgroundColor: '#FAF9F6', borderRadius: 20, padding: 12, flexDirection: 'row', alignItems: 'center' }}>
      <FlexWidget clickAction="OPEN_APP" style={{ alignItems: 'center', justifyContent: 'center' }}>
        {image}
      </FlexWidget>
      <FlexWidget style={{ flex: 1, flexDirection: 'column', marginLeft: 10 }}>
        <TextWidget text={data.statusLine} style={{ fontSize: 12, color: muted, marginBottom: 6 }} maxLines={2} />
        <GoalButton icon="water" label="Water" done={data.waterDone} uri="youchi://today/water" />
        <GoalButton icon="move" label="Move" done={data.movementDone} uri="youchi://today/goal/movement" />
        <GoalButton icon="eat" label="Eat" done={data.eatingDone} uri="youchi://today/goal/eating" />
      </FlexWidget>
    </FlexWidget>
  );
}
