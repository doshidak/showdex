import { describe, expect, it } from 'vitest';
import { getDefaultSpreadValue } from './getDefaultSpreadValue';

describe('getDefaultSpreadValue()', () => {
  // also doubles as a guard that the .env config actually loaded under test
  it('returns the randoms EV default (85) for normal random formats', () => {
    expect(getDefaultSpreadValue('ev', 'gen9randombattle')).toBe(85);
  });

  it('returns the standard EV default (0) for non-random formats', () => {
    expect(getDefaultSpreadValue('ev', 'gen9ou')).toBe(0);
  });

  it('returns 11 stat points (not the randoms 85, not 0) for Champions randbats', () => {
    // PS's Champions team generator starts every stat at 11 stat points & the pkmn randbats data omits stats
    // at that default -- 85 would wildly inflate them & 0 underestimates every opposing stat
    expect(getDefaultSpreadValue('ev', 'gen9championsrandombattle')).toBe(11);
    expect(getDefaultSpreadValue('ev', 'gen9championsrandomdoublesbattle')).toBe(11);
  });

  it('returns 0 for non-random Champions formats too', () => {
    expect(getDefaultSpreadValue('ev', 'gen9championsvgc2026')).toBe(0);
  });

  it('still returns the standard IV default (31) for Champions formats', () => {
    expect(getDefaultSpreadValue('iv', 'gen9championsrandombattle')).toBe(31);
  });
});
