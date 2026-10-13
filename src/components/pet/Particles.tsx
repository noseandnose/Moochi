import { Canvas, Group, Rect } from '@shopify/react-native-skia';
import React, { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Easing, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors } from '@/ui/theme';

export interface ParticlesHandle {
  burst: (opts?: { x?: number; y?: number; count?: number; strength?: number; palette?: string[] }) => void;
}

interface Particle {
  angle: number;
  dist: number;
  size: number;
  color: string;
  spin: number;
  star: boolean;
}

const DEFAULT_PALETTE = [colors.ink, colors.sage, colors.coin, '#FFFEFA', colors.water];

/**
 * Pixel bursts for celebrations: squares and small plus-shaped stars that fly
 * out, drift down and fade. Everything runs on shared values so nothing
 * re-renders while the burst plays.
 */
export const Particles = forwardRef<ParticlesHandle, { width: number; height: number; reduceMotion?: boolean }>(
  function Particles({ width, height, reduceMotion }, ref) {
    const progress = useSharedValue(1);
    const [config, setConfig] = useState<{ particles: Particle[]; x: number; y: number; strength: number }>({
      particles: [],
      x: width / 2,
      y: height / 2,
      strength: 1,
    });

    useImperativeHandle(ref, () => ({
      burst: (opts) => {
        const count = reduceMotion ? 6 : (opts?.count ?? 14);
        const palette = opts?.palette ?? DEFAULT_PALETTE;
        const particles: Particle[] = Array.from({ length: count }, (_, i) => {
          const angle = -Math.PI / 2 + ((i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.6);
          return {
            angle,
            dist: 34 + Math.random() * 40,
            size: 4 + Math.round(Math.random() * 3),
            color: palette[i % palette.length],
            spin: (Math.random() - 0.5) * 2,
            star: i % 3 === 0,
          };
        });
        setConfig({ particles, x: opts?.x ?? width / 2, y: opts?.y ?? height / 2, strength: opts?.strength ?? 1 });
        progress.value = 0;
        progress.value = withTiming(1, { duration: reduceMotion ? 500 : 950, easing: Easing.out(Easing.quad) });
      },
    }));

    return (
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        {config.particles.map((p, i) => (
          <ParticleView key={`${i}-${p.angle}`} p={p} cx={config.x} cy={config.y} strength={config.strength} progress={progress} />
        ))}
      </Canvas>
    );
  },
);

function ParticleView({ p, cx, cy, strength, progress }: { p: Particle; cx: number; cy: number; strength: number; progress: { value: number } }) {
  const transform = useDerivedValue(() => {
    const t = progress.value;
    const ease = 1 - Math.pow(1 - t, 3);
    const x = cx + Math.cos(p.angle) * p.dist * strength * ease;
    const y = cy + Math.sin(p.angle) * p.dist * strength * ease + 26 * t * t;
    return [{ translateX: x }, { translateY: y }, { rotate: p.spin * t * 2 }];
  });
  const opacity = useDerivedValue(() => {
    const t = progress.value;
    if (t >= 1) return 0;
    return t < 0.55 ? 1 : 1 - (t - 0.55) / 0.45;
  });
  const s = p.size;
  const arms = useMemo(() => (p.star ? [[-s * 1.5, -s / 2, s * 3, s], [-s / 2, -s * 1.5, s, s * 3]] : [[-s / 2, -s / 2, s, s]]), [p.star, s]);
  return (
    <Group transform={transform} opacity={opacity}>
      {arms.map(([x, y, w, h], i) => (
        <Rect key={i} x={x} y={y} width={w} height={h} color={p.color} />
      ))}
    </Group>
  );
}
