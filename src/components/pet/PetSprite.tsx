import { Canvas, FilterMode, Group, Image, MipmapMode, Rect, rect, useImage } from '@shopify/react-native-skia';
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import {
  Easing,
  cancelAnimation,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { GearId, HabitPath, PetId, StageId } from '@/game';

import { CELL, SHEETS, SHEET_SIZE, eggCell, frameTable, overlayCell, type Cell, type EggFrame, type Eyes } from './sprites';

export interface PetSpriteHandle {
  /** Quick squash-and-stretch with happy eyes. */
  react: () => void;
  /** Bigger jump with a longer happy face. */
  celebrate: () => void;
  /** Egg wobble, crack and reveal. Resolves when the baby is shown. */
  hatch: () => Promise<void>;
  /** Flash and pop used when the stage changes. */
  evolve: () => Promise<void>;
}

export interface PetSpriteProps {
  petId: PetId;
  stage: StageId;
  path: HabitPath;
  gear: GearId;
  /** Display size in points for the 128px cell. */
  size: number;
  /** Idle animation on/off (off when the screen is not focused or motion is reduced). */
  animate?: boolean;
  reduceMotion?: boolean;
  /** Forces a particular idle frame (used in static previews). */
  staticEyes?: Eyes;
  /** Called at the bright moment of a hatch or evolution so the parent can spawn particles. */
  onFlash?: () => void;
  /** Called with a pixel-aligned draw rect so parents can position particles. */
  onPetBounds?: (bounds: { x: number; y: number; width: number; height: number }) => void;
}

const NEAREST = { filter: FilterMode.Nearest, mipmap: MipmapMode.None } as const;
const MOTION_SEQUENCE = [0, 1, 1, 0, 2, 2];

export const PetSprite = forwardRef<PetSpriteHandle, PetSpriteProps>(function PetSprite(
  { petId, stage, path, gear, size, animate = true, reduceMotion = false, staticEyes, onFlash },
  ref,
) {
  const sheet = useImage(SHEETS[petId]);
  const scale = size / CELL;
  const frames = useMemo(() => frameTable(petId, stage), [petId, stage]);
  const [sheetW, sheetH] = SHEET_SIZE[petId];

  // Which cell of the sheet the body shows.
  const cellX = useSharedValue(frames.open[0].x);
  const cellY = useSharedValue(frames.open[0].y);
  // Transform state (worklet side).
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);
  const ty = useSharedValue(0);
  const rot = useSharedValue(0);
  const flash = useSharedValue(0);
  const opacity = useSharedValue(1);

  const happyUntil = useRef(0);
  const eggFrameRef = useRef<EggFrame>('idle');

  // Reset the frame table when the pet or stage changes.
  useEffect(() => {
    const first = stage === 'egg' ? eggCell(petId, 'idle') : frames.open[0];
    cellX.value = first.x;
    cellY.value = first.y;
  }, [frames, petId, stage, cellX, cellY]);

  // Idle frame loop on a JS timer: cheap, and paused when inactive.
  useEffect(() => {
    if (!animate || reduceMotion || staticEyes) {
      const eyes: Eyes = staticEyes ?? 'open';
      const c = stage === 'egg' ? eggCell(petId, 'idle') : frames[eyes][0];
      cellX.value = c.x;
      cellY.value = c.y;
      return;
    }
    let tick = 0;
    let nextBlink = 18 + Math.floor(Math.random() * 14);
    let blinkFrames = 0;
    let appActive = AppState.currentState === 'active';
    const sub = AppState.addEventListener('change', (s) => {
      appActive = s === 'active';
    });
    const interval = setInterval(() => {
      if (!appActive) return;
      tick += 1;
      let cell: Cell;
      if (stage === 'egg') {
        // Slow, occasional wobble: three ticks every ~6 seconds.
        const phase = tick % 30;
        const f: EggFrame = phase === 0 ? 'wobble_l' : phase === 1 ? 'wobble_r' : phase === 2 ? 'wobble_l' : 'idle';
        eggFrameRef.current = f;
        cell = eggCell(petId, f);
      } else {
        const motion = MOTION_SEQUENCE[tick % MOTION_SEQUENCE.length];
        let eyes: Eyes = 'open';
        if (Date.now() < happyUntil.current) eyes = 'happy';
        else {
          if (tick >= nextBlink) {
            blinkFrames = 1;
            nextBlink = tick + 16 + Math.floor(Math.random() * 18);
          }
          if (blinkFrames > 0) {
            eyes = 'blink';
            blinkFrames -= 1;
          }
        }
        cell = frames[eyes][motion];
      }
      cellX.value = cell.x;
      cellY.value = cell.y;
    }, 200);
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [animate, reduceMotion, staticEyes, frames, petId, stage, cellX, cellY]);

  const showHappy = (ms: number) => {
    happyUntil.current = Date.now() + ms;
    if (stage !== 'egg') {
      const c = frames.happy[0];
      cellX.value = c.x;
      cellY.value = c.y;
    }
  };

  const reactNow = () => {
    showHappy(1100);
    if (reduceMotion) return;
    cancelAnimation(scaleX);
    cancelAnimation(scaleY);
    cancelAnimation(ty);
    // anticipation (squash) -> action (stretch up) -> settle
    scaleX.value = withSequence(
      withTiming(1.1, { duration: 90, easing: Easing.out(Easing.quad) }),
      withTiming(0.94, { duration: 140, easing: Easing.inOut(Easing.quad) }),
      withTiming(1, { duration: 260, easing: Easing.out(Easing.back(2)) }),
    );
    scaleY.value = withSequence(
      withTiming(0.88, { duration: 90, easing: Easing.out(Easing.quad) }),
      withTiming(1.08, { duration: 140, easing: Easing.inOut(Easing.quad) }),
      withTiming(1, { duration: 260, easing: Easing.out(Easing.back(2)) }),
    );
    ty.value = withSequence(
      withTiming(2, { duration: 90 }),
      withTiming(-size * 0.07, { duration: 160, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 240, easing: Easing.in(Easing.quad) }),
    );
  };

  const celebrateNow = () => {
    showHappy(1800);
    if (reduceMotion) return;
    cancelAnimation(scaleX);
    cancelAnimation(scaleY);
    cancelAnimation(ty);
    cancelAnimation(rot);
    const lift = petId === 'juno' || petId === 'ori' ? size * 0.2 : size * 0.14;
    scaleX.value = withSequence(
      withTiming(1.14, { duration: 120 }),
      withTiming(0.92, { duration: 160 }),
      withDelay(220, withTiming(1.06, { duration: 120 })),
      withTiming(1, { duration: 260, easing: Easing.out(Easing.back(2)) }),
    );
    scaleY.value = withSequence(
      withTiming(0.84, { duration: 120 }),
      withTiming(1.12, { duration: 160 }),
      withDelay(220, withTiming(0.94, { duration: 120 })),
      withTiming(1, { duration: 260, easing: Easing.out(Easing.back(2)) }),
    );
    ty.value = withSequence(
      withTiming(3, { duration: 120 }),
      withTiming(-lift, { duration: 260, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 240, easing: Easing.in(Easing.quad) }),
      withTiming(-lift * 0.3, { duration: 140, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 160, easing: Easing.in(Easing.quad) }),
    );
    rot.value = withSequence(
      withTiming(-0.06, { duration: 200 }),
      withTiming(0.06, { duration: 220 }),
      withTiming(0, { duration: 200 }),
    );
  };

  const hatchNow = () =>
    new Promise<void>((resolve) => {
      const seq: EggFrame[] = ['wobble_l', 'wobble_r', 'wobble_l', 'wobble_r', 'crack1', 'crack1', 'crack2', 'crack2', 'crack3', 'crack3'];
      const stepMs = reduceMotion ? 120 : 170;
      let i = 0;
      const run = () => {
        if (i < seq.length) {
          const c = eggCell(petId, seq[i]);
          cellX.value = c.x;
          cellY.value = c.y;
          if (!reduceMotion) {
            rot.value = withTiming(i % 2 === 0 ? -0.08 : 0.08, { duration: stepMs, easing: Easing.inOut(Easing.quad) });
          }
          i += 1;
          setTimeout(run, stepMs);
          return;
        }
        rot.value = withTiming(0, { duration: 80 });
        onFlash?.();
        flash.value = withSequence(withTiming(1, { duration: 120 }), withTiming(0, { duration: 420 }));
        // The parent swaps the stage prop once we resolve; pop in the new sprite.
        scaleX.value = 0.2;
        scaleY.value = 0.2;
        setTimeout(() => {
          scaleX.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.back(2.2)) });
          scaleY.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.back(2.2)) });
          resolve();
        }, 120);
      };
      run();
    });

  const evolveNow = () =>
    new Promise<void>((resolve) => {
      const dur = reduceMotion ? 1 : 1;
      if (reduceMotion) {
        onFlash?.();
        flash.value = withSequence(withTiming(0.8, { duration: 120 }), withTiming(0, { duration: 300 }));
        setTimeout(resolve, 160);
        return;
      }
      // anticipation: shrink and brighten, then burst and pop to the new form
      scaleX.value = withTiming(0.86, { duration: 260 * dur });
      scaleY.value = withTiming(0.86, { duration: 260 * dur });
      flash.value = withSequence(withTiming(0.55, { duration: 260 }), withTiming(1, { duration: 140 }), withTiming(0, { duration: 520 }));
      setTimeout(() => {
        onFlash?.();
        scaleX.value = withSequence(withTiming(1.22, { duration: 220, easing: Easing.out(Easing.quad) }), withTiming(1, { duration: 320, easing: Easing.out(Easing.back(2)) }));
        scaleY.value = withSequence(withTiming(1.22, { duration: 220, easing: Easing.out(Easing.quad) }), withTiming(1, { duration: 320, easing: Easing.out(Easing.back(2)) }));
        resolve();
      }, 380);
    });

  useImperativeHandle(ref, () => ({ react: reactNow, celebrate: celebrateNow, hatch: hatchNow, evolve: evolveNow }));

  // Gentle breathing when idle.
  const breath = useSharedValue(0);
  useEffect(() => {
    if (!animate || reduceMotion || stage === 'egg') {
      breath.value = 0;
      return;
    }
    breath.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(breath);
  }, [animate, reduceMotion, stage, breath]);

  const transform = useDerivedValue(() => {
    const pivotX = size / 2;
    const pivotY = size * (114 / 128); // feet line of the cell
    const sx = scaleX.value * (1 + breath.value * 0.012);
    const sy = scaleY.value * (1 - breath.value * 0.018);
    return [
      { translateX: pivotX },
      { translateY: pivotY + ty.value },
      { rotate: rot.value },
      { scaleX: sx },
      { scaleY: sy },
      { translateX: -pivotX },
      { translateY: -pivotY },
    ];
  });

  const imgX = useDerivedValue(() => -cellX.value * scale);
  const imgY = useDerivedValue(() => -cellY.value * scale);
  const flashOpacity = useDerivedValue(() => flash.value * 0.85);

  const overlays = useMemo(() => {
    const list: Cell[] = [];
    if (path !== 'balanced') {
      const c = overlayCell(petId, stage, path);
      if (c) list.push(c);
    }
    if (gear !== 'none') {
      const c = overlayCell(petId, stage, gear);
      if (c) list.push(c);
    }
    return list;
  }, [petId, stage, path, gear]);

  const clip = useMemo(() => rect(0, 0, size, size), [size]);

  return (
    <View style={{ width: size, height: size }} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        <Group transform={transform} opacity={opacity}>
          <Group clip={clip}>
            <Image image={sheet} x={imgX} y={imgY} width={sheetW * scale} height={sheetH * scale} fit="fill" sampling={NEAREST} />
            {overlays.map((c, i) => (
              <Image
                key={`${c.x}-${c.y}-${i}`}
                image={sheet}
                x={-c.x * scale}
                y={-c.y * scale}
                width={sheetW * scale}
                height={sheetH * scale}
                fit="fill"
                sampling={NEAREST}
              />
            ))}
          </Group>
          <Rect x={0} y={0} width={size} height={size} color="#FFFEFA" opacity={flashOpacity} blendMode="srcATop" />
        </Group>
      </Canvas>
    </View>
  );
});
