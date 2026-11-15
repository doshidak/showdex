import { describe, expect, it } from 'vitest';
import { populateStatsTable } from './populateStatsTable';

describe('populateStatsTable()', () => {
  it('fills omitted EVs with the standard 0 default for non-random formats', () => {
    const out = populateStatsTable({ hp: 252, def: 252, spd: 4 }, { spread: 'ev', format: 'gen9ou' });

    expect(out).toStrictEqual({
 hp: 252, atk: 0, def: 252, spa: 0, spd: 4, spe: 0,
});
  });

  it('fills omitted Champions randbats stat points with 11 (not 0, not the randoms 85)', () => {
    // mirrors the pkmn randbats data for e.g. Overqwil: no `evs` key at all, since every stat sits at the
    // generator's 11-point default
    const out = populateStatsTable(null, { spread: 'ev', format: 'gen9championsrandombattle' });

    expect(out).toStrictEqual({
 hp: 11, atk: 11, def: 11, spa: 11, spd: 11, spe: 11,
});
  });

  it('keeps listed Champions randbats deviations & fills the rest with 11', () => {
    // mirrors the pkmn randbats data for e.g. Bellibolt (`{ atk: 0 }`) & Azumarill (`{ hp: 10 }`)
    expect(populateStatsTable({ atk: 0 }, { spread: 'ev', format: 'gen9championsrandombattle' })).toStrictEqual({
 hp: 11, atk: 0, def: 11, spa: 11, spd: 11, spe: 11,
});

    expect(populateStatsTable({ hp: 10 }, { spread: 'ev', format: 'gen9championsrandombattle' })).toStrictEqual({
 hp: 10, atk: 11, def: 11, spa: 11, spd: 11, spe: 11,
});
  });

  it('fills omitted stat points with 0 for non-random Champions formats', () => {
    const out = populateStatsTable({ hp: 32, spe: 32, def: 2 }, { spread: 'ev', format: 'gen9championsou' });

    expect(out).toStrictEqual({
 hp: 32, atk: 0, def: 2, spa: 0, spd: 0, spe: 32,
});
  });

  it('still fills omitted EVs with the randoms 85 default for normal randbats', () => {
    const out = populateStatsTable({ spa: 85, spe: 85 }, { spread: 'ev', format: 'gen9randombattle' });

    expect(out.atk).toBe(85);
  });
});
