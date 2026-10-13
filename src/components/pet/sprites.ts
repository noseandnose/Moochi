import type { DataSourceParam } from '@shopify/react-native-skia';

import type { GearId, HabitPath, PetId, PetMood, StageId } from '@/game';
import { ATLAS, CELL, SHEET_SIZES } from '@/assets/atlas';

export { CELL };

export const SHEETS: Record<PetId, DataSourceParam> = {
  tofu: require('../../../assets/sprites/tofu.png'),
  juno: require('../../../assets/sprites/juno.png'),
  pebble: require('../../../assets/sprites/pebble.png'),
  ori: require('../../../assets/sprites/ori.png'),
  fern: require('../../../assets/sprites/fern.png'),
};

export const SHEET_SIZE = SHEET_SIZES;

export type EggFrame = 'idle' | 'wobble_l' | 'wobble_r' | 'crack1' | 'crack2' | 'crack3';
export type Eyes = 'open' | 'blink' | 'happy';

export interface Cell {
  x: number;
  y: number;
}

function lookup(pet: PetId, key: string): Cell {
  const entry = ATLAS[pet][key];
  if (!entry) {
    const fallback = ATLAS[pet]['teen:0:open'];
    return { x: fallback[0], y: fallback[1] };
  }
  return { x: entry[0], y: entry[1] };
}

export function bodyCell(pet: PetId, stage: StageId, motion: number, eyes: Eyes): Cell {
  if (stage === 'egg') return eggCell(pet, 'idle');
  return lookup(pet, `${stage}:${motion}:${eyes}`);
}

/** Mood frame (asleep, thirsty, hungry, lazy). Content and eggs have none. */
export function moodCell(pet: PetId, stage: StageId, mood: PetMood): Cell | null {
  if (stage === 'egg' || mood === 'content') return null;
  return lookup(pet, `mood:${stage}:${mood}`);
}

export function eggCell(pet: PetId, frame: EggFrame): Cell {
  return lookup(pet, `egg:${frame}`);
}

export function overlayCell(pet: PetId, stage: StageId, kind: Exclude<HabitPath, 'balanced'> | Exclude<GearId, 'none'>): Cell | null {
  if (stage === 'egg') return null;
  return lookup(pet, `ov:${stage}:${kind}`);
}

/** Full frame table for a stage so the animation loop never does string work. */
export function frameTable(pet: PetId, stage: StageId): Record<Eyes, Cell[]> {
  if (stage === 'egg') {
    const idle = eggCell(pet, 'idle');
    return { open: [idle, idle, idle], blink: [idle, idle, idle], happy: [idle, idle, idle] };
  }
  const build = (eyes: Eyes) => [0, 1, 2].map((m) => bodyCell(pet, stage, m, eyes));
  return { open: build('open'), blink: build('blink'), happy: build('happy') };
}
