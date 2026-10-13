import { reduce } from '..';
import type { GameState } from '..';
import { errors, onboarded } from './helpers';

function withCoins(coins: number): GameState {
  const s = onboarded();
  return { ...s, progress: { ...s.progress, coins } };
}

describe('gear', () => {
  test('insufficient coins never spends and explains the gap', () => {
    const r = reduce(withCoins(60), { type: 'buyGear', gear: 'cap' });
    expect(errors(r.events)[0]).toMatchObject({ code: 'insufficientCoins', message: '10 more coins to unlock Cap.' });
    expect(r.state.progress.coins).toBe(60);
    expect(r.state.progress.ownedGear).toEqual(['none']);
  });

  test('purchase is atomic, equips, and cannot repeat', () => {
    const bought = reduce(withCoins(75), { type: 'buyGear', gear: 'cap' });
    expect(bought.events).toEqual([
      { type: 'purchase', gear: 'cap', cost: 70 },
      { type: 'equipped', gear: 'cap' },
    ]);
    expect(bought.state.progress).toMatchObject({ coins: 5, ownedGear: ['none', 'cap'], equippedGear: 'cap' });
    const again = reduce(bought.state, { type: 'buyGear', gear: 'cap' });
    expect(again.state.progress.coins).toBe(5);
    expect(again.events).toEqual([]);
    expect(again.state.progress.ownedGear).toEqual(['none', 'cap']);
  });

  test('coins never go negative', () => {
    const r = reduce(withCoins(179), { type: 'buyGear', gear: 'crown' });
    expect(r.state.progress.coins).toBe(179);
    expect(errors(r.events)).toHaveLength(1);
  });

  test('equip requires ownership and None is always free', () => {
    const notOwned = reduce(withCoins(0), { type: 'equipGear', gear: 'scarf' });
    expect(errors(notOwned.events)[0]).toMatchObject({ code: 'notOwned' });
    const bought = reduce(withCoins(200), { type: 'buyGear', gear: 'scarf' }).state;
    const none = reduce(bought, { type: 'equipGear', gear: 'none' });
    expect(none.state.progress.equippedGear).toBe('none');
    const back = reduce(none.state, { type: 'equipGear', gear: 'scarf' });
    expect(back.state.progress.equippedGear).toBe('scarf');
    expect(back.state.progress.coins).toBe(80);
    const free = reduce(withCoins(0), { type: 'buyGear', gear: 'none' });
    expect(errors(free.events)).toHaveLength(0);
  });
});
