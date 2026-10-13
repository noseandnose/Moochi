import {
  Canvas,
  FilterMode,
  Group,
  Image,
  MipmapMode,
  Rect,
  RoundedRect,
  Text as SkText,
  rect,
  rrect,
  useCanvasRef,
  useFont,
  type CanvasRef,
  type SkFont,
} from '@shopify/react-native-skia';
import React, { forwardRef, useEffect, useMemo } from 'react';

import type { GearId, HabitPath, PetId, StageId } from '@/game';
import { colors } from '@/ui/theme';

import { CELL, SHEETS, SHEET_SIZE, bodyCell, overlayCell } from '../pet/sprites';
import { useCachedImage } from '../pet/useCachedImage';

export const CARD_W = 320;
export const CARD_H = 440;
const NEAREST = { filter: FilterMode.Nearest, mipmap: MipmapMode.None } as const;
const logoSource = require('../../../assets/brand/logo.png');
// Inter (SIL Open Font License, see assets/fonts/LICENSE-Inter-OFL.txt), subset to Latin.
const interBold = require('../../../assets/fonts/Inter-Bold.otf');
const interRegular = require('../../../assets/fonts/Inter-Regular.otf');

/** Glyph-width measurement works on native and in CanvasKit alike. */
function textWidth(font: SkFont, text: string): number {
  const ids = font.getGlyphIDs(text);
  return font.getGlyphWidths(ids).reduce((sum, w) => sum + w, 0);
}

export interface ShareCardProps {
  petId: PetId;
  stage: StageId;
  path: HabitPath;
  gear: GearId;
  name: string;
  level: number;
  stageName: string;
  pathName: string;
  /** Reports when every image and font the card draws has loaded. */
  onReady?: (ready: boolean) => void;
}

export { useCanvasRef };
export type { CanvasRef };

/**
 * The shareable pet card. Deliberately contains no habit data: only the pet,
 * its name, level, stage and path.
 */
export const ShareCard = forwardRef<CanvasRef, ShareCardProps>(function ShareCard({ petId, stage, path, gear, name, level, stageName, pathName, onReady }, ref) {
  const sheet = useCachedImage(SHEETS[petId]);
  const logo = useCachedImage(logoSource);
  const [sheetW, sheetH] = SHEET_SIZE[petId];
  const nameFont = useFont(interBold, 30);
  const metaFont = useFont(interRegular, 15);
  const lineFont = useFont(interBold, 13);
  const fonts = { name: nameFont, meta: metaFont, line: lineFont };
  const ready = !!(sheet && logo && nameFont && metaFont && lineFont);
  useEffect(() => {
    onReady?.(ready);
  }, [ready, onReady]);

  const spriteSize = 216;
  const scale = spriteSize / CELL;
  const spriteX = (CARD_W - spriteSize) / 2;
  const spriteY = 92;
  const panelY = 82;
  const panelH = 250;
  const body = bodyCell(petId, stage, 0, stage === 'egg' ? 'open' : 'happy');
  const overlays = [path !== 'balanced' ? overlayCell(petId, stage, path) : null, gear !== 'none' ? overlayCell(petId, stage, gear) : null].filter(
    (c): c is { x: number; y: number } => !!c,
  );

  const centered = (text: string, f: SkFont | null, maxWidth = CARD_W - 48) => {
    if (!f) return { x: CARD_W / 2, text, font: f };
    let t = text;
    let width = textWidth(f, t);
    while (width > maxWidth && t.length > 3) {
      t = `${t.slice(0, -2)}…`;
      width = textWidth(f, t);
    }
    return { x: (CARD_W - width) / 2, text: t, font: f };
  };

  const nameLine = centered(name, fonts.name);
  const metaLine = centered(`Level ${level} · ${stageName} · ${pathName}`, fonts.meta);
  const tagline = centered('Build habits. Level up.', fonts.line);
  const footer = centered('What will you unlock next?', fonts.meta);
  const clip = useMemo(() => rect(spriteX, spriteY, spriteSize, spriteSize), [spriteX]);
  const logoW = 120;
  const logoH = 21;

  return (
    <Canvas ref={ref} style={{ width: CARD_W, height: CARD_H }}>
      <RoundedRect rect={rrect(rect(0, 0, CARD_W, CARD_H), 24, 24)} color={colors.background} />
      <RoundedRect rect={rrect(rect(10, 10, CARD_W - 20, CARD_H - 20), 18, 18)} color={colors.ink} style="stroke" strokeWidth={2} />
      <Rect x={28} y={panelY} width={CARD_W - 56} height={panelH} color={colors.sageSoft} />
      <Rect x={28} y={panelY + panelH - 36} width={CARD_W - 56} height={36} color="#C9D3BE" />
      <Image image={logo} x={(CARD_W - logoW) / 2} y={24} width={logoW} height={logoH} fit="fill" sampling={NEAREST} />
      <Group clip={clip}>
        <Image image={sheet} x={spriteX - body.x * scale} y={spriteY - body.y * scale} width={sheetW * scale} height={sheetH * scale} fit="fill" sampling={NEAREST} />
        {overlays.map((c, i) => (
          <Image key={i} image={sheet} x={spriteX - c.x * scale} y={spriteY - c.y * scale} width={sheetW * scale} height={sheetH * scale} fit="fill" sampling={NEAREST} />
        ))}
      </Group>
      {fonts.name ? <SkText x={nameLine.x} y={panelY + panelH + 42} text={nameLine.text} font={fonts.name} color={colors.ink} /> : null}
      {fonts.meta ? <SkText x={metaLine.x} y={panelY + panelH + 68} text={metaLine.text} font={fonts.meta} color={colors.inkSoft} /> : null}
      {fonts.line ? <SkText x={tagline.x} y={66} text={tagline.text} font={fonts.line} color={colors.inkMuted} /> : null}
      {fonts.meta ? <SkText x={footer.x} y={CARD_H - 16} text={footer.text} font={fonts.meta} color={colors.inkFaint} /> : null}
    </Canvas>
  );
});
