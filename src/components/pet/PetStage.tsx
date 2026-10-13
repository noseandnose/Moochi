import { Canvas, FilterMode, Group, Image, MipmapMode, useImage } from '@shopify/react-native-skia';
import { useIsFocused } from 'expo-router';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Easing, cancelAnimation, useDerivedValue, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { PET_BY_ID, type GearId, type HabitPath, type PetId, type StageId } from '@/game';
import { useReduceMotion } from '@/hooks/useMotion';
import { colors, radius } from '@/ui/theme';

import { Particles, type ParticlesHandle } from './Particles';
import { PetSprite, type PetSpriteHandle } from './PetSprite';

const SCENES: Record<PetId, { sky: number; far: number; near: number; ground: number }> = {
  foxi: {
    sky: require('../../../assets/scenes/foxi_sky.png'),
    far: require('../../../assets/scenes/foxi_far.png'),
    near: require('../../../assets/scenes/foxi_near.png'),
    ground: require('../../../assets/scenes/foxi_ground.png'),
  },
  lumi: {
    sky: require('../../../assets/scenes/lumi_sky.png'),
    far: require('../../../assets/scenes/lumi_far.png'),
    near: require('../../../assets/scenes/lumi_near.png'),
    ground: require('../../../assets/scenes/lumi_ground.png'),
  },
  drako: {
    sky: require('../../../assets/scenes/drako_sky.png'),
    far: require('../../../assets/scenes/drako_far.png'),
    near: require('../../../assets/scenes/drako_near.png'),
    ground: require('../../../assets/scenes/drako_ground.png'),
  },
};

export const SCENE_W = 256;
export const SCENE_H = 144;
const NEAREST = { filter: FilterMode.Nearest, mipmap: MipmapMode.None } as const;

export interface PetStageHandle {
  react: () => void;
  celebrate: () => void;
  hatch: () => Promise<void>;
  evolve: () => Promise<void>;
  burst: (strength?: number) => void;
}

export interface PetStageProps {
  petId: PetId;
  stage: StageId;
  path: HabitPath;
  gear: GearId;
  /** Height of the scene in points; width fills the container. */
  height?: number;
  /** Pet cell size relative to the scene height. */
  petScale?: number;
  onPress?: () => void;
  accessibilityLabel: string;
  animate?: boolean;
  children?: React.ReactNode;
}

/**
 * The habitat: layered pixel scenery with gentle parallax, the animated pet,
 * and a particle layer for celebrations.
 */
export const PetStage = forwardRef<PetStageHandle, PetStageProps>(function PetStage(
  { petId, stage, path, gear, height = 220, petScale = 0.98, onPress, accessibilityLabel, animate = true, children },
  ref,
) {
  const [width, setWidth] = useState(0);
  const focused = useIsFocused();
  const reduce = useReduceMotion();
  const sprite = useRef<PetSpriteHandle>(null);
  const particles = useRef<ParticlesHandle>(null);
  const scene = SCENES[petId];
  const sky = useImage(scene.sky);
  const far = useImage(scene.far);
  const near = useImage(scene.near);
  const ground = useImage(scene.ground);
  const active = animate && focused;

  const onLayout = useCallback((e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width), []);

  // Parallax drift: far layer sways slowly, near layer a touch faster.
  const drift = useSharedValue(0);
  useEffect(() => {
    if (!active || reduce) {
      drift.value = 0;
      return;
    }
    drift.value = withRepeat(withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(drift);
  }, [active, reduce, drift]);
  const farTransform = useDerivedValue(() => [{ translateX: (drift.value - 0.5) * 6 }]);
  const nearTransform = useDerivedValue(() => [{ translateX: (0.5 - drift.value) * 3 }]);

  const petSize = Math.round(height * petScale);
  // Feet sit on the platform edge (unit 58/72 of the scene).
  const feetY = height * (59 / 72);
  const petTop = feetY - petSize * (114 / 128);
  const petLeft = width / 2 - petSize / 2;

  const burst = useCallback(
    (strength = 1) => {
      particles.current?.burst({ x: width / 2, y: petTop + petSize * 0.5, strength, count: 16 });
    },
    [width, petTop, petSize],
  );

  useImperativeHandle(
    ref,
    () => ({
      react: () => sprite.current?.react(),
      celebrate: () => {
        sprite.current?.celebrate();
        burst(1);
      },
      hatch: () => sprite.current?.hatch() ?? Promise.resolve(),
      evolve: () => sprite.current?.evolve() ?? Promise.resolve(),
      burst,
    }),
    [burst],
  );

  // Scale the 256x144 scene to cover the stage.
  const scale = width ? Math.max(width / SCENE_W, height / SCENE_H) : 1;
  const sceneW = SCENE_W * scale;
  const sceneH = SCENE_H * scale;
  const sceneX = (width - sceneW) / 2;
  const sceneY = height - sceneH;

  return (
    <View style={[styles.wrap, { height }]} onLayout={onLayout}>
      {width > 0 ? (
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          <Image image={sky} x={sceneX} y={sceneY} width={sceneW} height={sceneH} fit="fill" sampling={NEAREST} />
          <Group transform={farTransform}>
            <Image image={far} x={sceneX} y={sceneY} width={sceneW} height={sceneH} fit="fill" sampling={NEAREST} />
          </Group>
          <Group transform={nearTransform}>
            <Image image={near} x={sceneX} y={sceneY} width={sceneW} height={sceneH} fit="fill" sampling={NEAREST} />
          </Group>
          <Image image={ground} x={sceneX} y={sceneY} width={sceneW} height={sceneH} fit="fill" sampling={NEAREST} />
        </Canvas>
      ) : null}
      {width > 0 ? (
        <View style={{ position: 'absolute', left: petLeft, top: petTop }} pointerEvents="none">
          <PetSprite
            ref={sprite}
            petId={petId}
            stage={stage}
            path={path}
            gear={gear}
            size={petSize}
            animate={active}
            reduceMotion={reduce}
            onFlash={() => burst(1.3)}
          />
        </View>
      ) : null}
      {width > 0 ? <Particles ref={particles} width={width} height={height} reduceMotion={reduce} /> : null}
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={`Interact with ${PET_BY_ID[petId].name}`}
          onPress={onPress}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.line,
  },
});
