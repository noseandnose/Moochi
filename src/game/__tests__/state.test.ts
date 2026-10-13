import { MIGRATIONS, SCHEMA_VERSION, createInitialState, loadState, reduce, sanitize } from '..';
import { DAY1, grindDays, onboarded } from './helpers';

describe('persistence and migrations', () => {
  test('null storage is a fresh install', () => {
    expect(loadState(null)).toEqual({ kind: 'fresh' });
    expect(loadState(undefined)).toEqual({ kind: 'fresh' });
  });

  test('round-trips a real state through JSON unchanged', () => {
    const s = grindDays(onboarded(), 2);
    const out = loadState(JSON.parse(JSON.stringify(s)));
    expect(out.kind).toBe('ok');
    if (out.kind === 'ok') {
      expect(out.state).toEqual(s);
      expect(out.migrated).toBe(false);
    }
  });

  test('garbage payloads are reported as corrupt and replaced by defaults', () => {
    expect(loadState('nope').kind).toBe('corrupt');
    expect(loadState([1, 2]).kind).toBe('corrupt');
    expect(loadState(42).kind).toBe('corrupt');
  });

  test('missing or malformed fields fall back without destroying valid progress', () => {
    const s = grindDays(onboarded(), 1);
    const damaged = {
      ...JSON.parse(JSON.stringify(s)),
      prefs: 'broken',
      profile: { ...s.profile, waterTargetMl: 'lots', petId: 'dragon', movementMinutes: 9999 },
      progress: { ...s.progress, coins: -50, ownedGear: ['none', 'hat', 'crown'], equippedGear: 'cap' },
      ledger: { '2026-10-13': { water: true, nonsense: true }, 'bad-key': { water: true } },
      history: { '2026-10-13': { water: 'yes' } },
    };
    const out = loadState(damaged);
    expect(out.kind).toBe('ok');
    if (out.kind !== 'ok') return;
    expect(out.state.prefs).toEqual(createInitialState().prefs);
    expect(out.state.profile.waterTargetMl).toBe(2500);
    expect(out.state.profile.petId).toBe('tofu');
    expect(out.state.profile.movementMinutes).toBe(240);
    expect(out.state.progress.xp).toBe(120);
    expect(out.state.progress.coins).toBe(0);
    expect(out.state.progress.ownedGear).toEqual(['none', 'crown']);
    expect(out.state.progress.equippedGear).toBe('none');
    expect(out.state.ledger).toEqual({ '2026-10-13': { water: true } });
    expect(out.state.history).toEqual({ '2026-10-13': { water: false, movement: false, eating: false, bonus: false, selfie: false, custom: false } });
    expect(out.state.createdOn).toBe('2026-10-13');
  });

  test('unversioned data runs through the migration chain', () => {
    const original = MIGRATIONS[0];
    MIGRATIONS[0] = (raw) => ({ ...raw, profile: { ...(raw.profile as object), petName: 'Migrated' } });
    try {
      const out = loadState({ profile: { petName: 'Old' }, createdOn: '2026-01-01' });
      expect(out.kind).toBe('ok');
      if (out.kind === 'ok') {
        expect(out.migrated).toBe(true);
        expect(out.state.profile.petName).toBe('Migrated');
        expect(out.state.schemaVersion).toBe(SCHEMA_VERSION);
      }
    } finally {
      if (original) MIGRATIONS[0] = original;
      else delete MIGRATIONS[0];
    }
  });

  test('sanitize always produces the current schema version', () => {
    expect(sanitize({}).schemaVersion).toBe(SCHEMA_VERSION);
  });

  test('reset returns a pristine state', () => {
    const s = grindDays(onboarded(), 3);
    expect(reduce(s, { type: 'reset' }).state).toEqual(createInitialState());
  });

  test('onboarding sets createdOn and validates targets', () => {
    const s = onboarded(DAY1, { petName: '   ', eatingGoal: '' });
    expect(s.createdOn).toBe('2026-10-13');
    expect(s.profile.petName).toBe('Tofu');
    expect(s.profile.eatingGoal).toBe('Eat a balanced meal');
    expect(s.today.date).toBe('2026-10-13');
    const bad = reduce(createInitialState(), {
      type: 'completeOnboarding',
      input: { petId: 'juno', petName: 'L', gender: 'male', waterUnit: 'oz', waterTargetMl: 0, movementMinutes: 30, eatingGoal: 'x' },
      now: DAY1,
    });
    expect(bad.state.createdOn).toBeNull();
    expect(bad.events[0]).toMatchObject({ type: 'error', code: 'invalidTarget' });
  });

  test('switching pets and renaming keep progress', () => {
    const s = grindDays(onboarded(), 2);
    const switched = reduce(s, { type: 'selectPet', petId: 'ori' }).state;
    expect(switched.progress).toEqual(s.progress);
    expect(switched.profile.petId).toBe('ori');
    const renamed = reduce(switched, { type: 'renamePet', name: '  Ember  ' }).state;
    expect(renamed.profile.petName).toBe('Ember');
    expect(reduce(renamed, { type: 'renamePet', name: '  ' }).events[0]).toMatchObject({ code: 'invalidName' });
  });
});
