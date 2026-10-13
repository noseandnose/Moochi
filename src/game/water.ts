import type { WaterUnit } from './types';

/** 1 US fluid ounce in millilitres (exact). */
export const ML_PER_FL_OZ = 29.5735295625;

/**
 * Tolerance used when comparing consumed water against the target. Half a
 * millilitre is below any displayed precision, so a target that *looks*
 * reached is treated as reached.
 */
export const WATER_EPSILON_ML = 0.5;

export function toMl(amount: number, unit: WaterUnit): number {
  return unit === 'oz' ? amount * ML_PER_FL_OZ : amount;
}

export function fromMl(ml: number, unit: WaterUnit): number {
  return unit === 'oz' ? ml / ML_PER_FL_OZ : ml;
}

/**
 * Display value for an amount. Consumed amounts round to the nearest unit
 * step; targets round *up* so a target never displays smaller than it is.
 */
export function displayAmount(ml: number, unit: WaterUnit, kind: 'amount' | 'target' = 'amount'): number {
  if (unit === 'oz') {
    const oz = fromMl(ml, 'oz') * 10;
    const stepped = kind === 'target' ? Math.ceil(oz - 1e-7) : Math.round(oz);
    return stepped / 10;
  }
  return kind === 'target' ? Math.ceil(ml - 1e-7) : Math.round(ml);
}

export function unitLabel(unit: WaterUnit): string {
  return unit === 'oz' ? 'fl oz' : 'ml';
}

export function formatWater(ml: number, unit: WaterUnit, kind: 'amount' | 'target' = 'amount'): string {
  const value = displayAmount(ml, unit, kind);
  const text = unit === 'oz' ? value.toFixed(value % 1 === 0 ? 0 : 1) : String(value);
  return `${withThousands(text)} ${unitLabel(unit)}`;
}

function withThousands(text: string): string {
  const [whole, frac] = text.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return frac ? `${grouped}.${frac}` : grouped;
}

export function quickAddAmounts(unit: WaterUnit): { label: string; ml: number }[] {
  return unit === 'oz'
    ? [
        { label: '+ 8 fl oz', ml: toMl(8, 'oz') },
        { label: '+ 16 fl oz', ml: toMl(16, 'oz') },
      ]
    : [
        { label: '+ 250 ml', ml: 250 },
        { label: '+ 500 ml', ml: 500 },
      ];
}

export function isWaterTargetReached(consumedMl: number, targetMl: number): boolean {
  return consumedMl >= targetMl - WATER_EPSILON_ML;
}

export function waterPercent(consumedMl: number, targetMl: number): number {
  if (targetMl <= 0) return 0;
  if (isWaterTargetReached(consumedMl, targetMl)) return 100;
  return Math.min(99, Math.floor((consumedMl / targetMl) * 100));
}

/** Parses user text into a positive finite number, or null. */
export function parseAmount(text: string): number | null {
  const normalised = text.trim().replace(',', '.');
  if (!/^\d*\.?\d+$/.test(normalised) && !/^\d+\.?$/.test(normalised)) return null;
  const n = Number(normalised);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}
