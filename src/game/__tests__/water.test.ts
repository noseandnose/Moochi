import {
  ML_PER_FL_OZ,
  displayAmount,
  formatWater,
  fromMl,
  isWaterTargetReached,
  parseAmount,
  quickAddAmounts,
  toMl,
  waterPercent,
} from '..';

describe('water units', () => {
  test('converts with the exact US fluid ounce', () => {
    expect(toMl(1, 'oz')).toBeCloseTo(29.5735295625, 10);
    expect(fromMl(ML_PER_FL_OZ, 'oz')).toBeCloseTo(1, 10);
    expect(toMl(250, 'ml')).toBe(250);
  });

  test('round-trips without drift', () => {
    const ml = 1892.705892;
    expect(toMl(fromMl(ml, 'oz'), 'oz')).toBeCloseTo(ml, 9);
  });

  test('switching units changes presentation only', () => {
    const stored = 2000;
    expect(formatWater(stored, 'ml')).toBe('2,000 ml');
    expect(formatWater(stored, 'oz')).toBe('67.6 fl oz');
    expect(formatWater(stored, 'oz', 'target')).toBe('67.7 fl oz');
    expect(formatWater(stored, 'ml', 'target')).toBe('2,000 ml');
  });

  test('targets round up and amounts round to nearest', () => {
    expect(displayAmount(2000, 'oz', 'target')).toBe(67.7);
    expect(displayAmount(2000, 'oz', 'amount')).toBe(67.6);
    expect(displayAmount(1999.6, 'ml', 'amount')).toBe(2000);
    expect(displayAmount(toMl(64, 'oz'), 'oz', 'target')).toBe(64);
  });

  test('quick add buttons match the unit', () => {
    expect(quickAddAmounts('ml').map((a) => a.ml)).toEqual([250, 500]);
    expect(quickAddAmounts('oz').map((a) => a.ml)).toEqual([toMl(8, 'oz'), toMl(16, 'oz')]);
  });

  test('a visibly reached target counts as reached', () => {
    // 8 x 8 fl oz summed in floating point against a 64 fl oz target.
    const target = toMl(64, 'oz');
    let consumed = 0;
    for (let i = 0; i < 8; i++) consumed += toMl(8, 'oz');
    expect(isWaterTargetReached(consumed, target)).toBe(true);
    expect(isWaterTargetReached(1999.6, 2000)).toBe(true);
    expect(isWaterTargetReached(1999.4, 2000)).toBe(false);
  });

  test('percent never shows 100 before completion', () => {
    expect(waterPercent(1999.4, 2000)).toBe(99);
    expect(waterPercent(1999.6, 2000)).toBe(100);
    expect(waterPercent(0, 2000)).toBe(0);
    expect(waterPercent(500, 2000)).toBe(25);
    expect(waterPercent(100, 0)).toBe(0);
  });

  test('rejects zero, negative, invalid and non-finite entries', () => {
    expect(parseAmount('0')).toBeNull();
    expect(parseAmount('-5')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('1e400')).toBeNull();
    expect(parseAmount('Infinity')).toBeNull();
    expect(parseAmount('NaN')).toBeNull();
    expect(parseAmount('350')).toBe(350);
    expect(parseAmount('12.5')).toBe(12.5);
    expect(parseAmount('12,5')).toBe(12.5);
    expect(parseAmount(' .5 ')).toBe(0.5);
  });
});
