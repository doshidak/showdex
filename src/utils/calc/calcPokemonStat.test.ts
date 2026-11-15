import { describe, expect, it } from 'vitest';
import { calcPokemonStat } from './calcPokemonStat';

// Champions stat formula (PS `champions` mod w/ levelclausemod): the standard level-scaled formula with
// floor(EV/4) replaced by max(2*statPoints - 1, 0) & a fixed 31 IV. The flat L50 form (base+pts+20/75) is
// just this evaluated at level 50 -- so VGC (fixed L50) must stay unchanged while other levels get corrected.
const CHAMPS = 'gen9championsrandombattle';

describe('calcPokemonStat() — Champions', () => {
  // Cam's L48 Kommo-o (base HP 75, Atk 110) — the screenshot's "Yours" set
  it('HP scales with level (L48 Kommo-o, base 75, 10 pts) = 154', () => {
    expect(calcPokemonStat(CHAMPS, 'hp', 75, 31, 10, 48)).toBe(154);
  });

  it('neutral Atk at L48 (base 110, 0 pts) = 125', () => {
    expect(calcPokemonStat(CHAMPS, 'atk', 110, 31, 0, 48, 'Hardy')).toBe(125);
  });

  it('+Atk (Adamant) at L48 (base 110, 0 pts) = 137', () => {
    expect(calcPokemonStat(CHAMPS, 'atk', 110, 31, 0, 48, 'Adamant')).toBe(137);
  });

  it('+Atk (Adamant) at L48 (base 110, 32 pts) = 170', () => {
    expect(calcPokemonStat(CHAMPS, 'atk', 110, 31, 32, 48, 'Adamant')).toBe(170);
  });

  // L50 regressions — must equal the old flat formula (base + pts + 75 / base + pts + 20)
  it('HP at L50 (base 75, 10 pts) = 160 (== flat base+pts+75)', () => {
    expect(calcPokemonStat(CHAMPS, 'hp', 75, 31, 10, 50)).toBe(160);
  });

  it('+Atk (Adamant) at L50 (base 110, 0 pts) = 143 (== flat (base+pts+20)*1.1)', () => {
    expect(calcPokemonStat(CHAMPS, 'atk', 110, 31, 0, 50, 'Adamant')).toBe(143);
  });

  it('Shedinja HP (base 1) stays 1', () => {
    expect(calcPokemonStat(CHAMPS, 'hp', 1, 31, 0, 50)).toBe(1);
  });

  // "floating" stat points (e.g. 10.5, from EV 80 via the 1st-pt=4EVs/rest=8EVs rule) are legit & must be
  // handled cleanly: 2*pts-1 stays integer for half-points, & the result matches the EV-80 standard stat.
  it('handles fractional (floating) stat points distinctly from their floor', () => {
    // at L100 the *level/100 factor is 1, so the half-point difference is visible (no truncation aliasing)
    expect(calcPokemonStat(CHAMPS, 'atk', 100, 31, 10, 100, 'Hardy')).toBe(255); // (200+31+19)+5
    expect(calcPokemonStat(CHAMPS, 'atk', 100, 31, 10.5, 100, 'Hardy')).toBe(256); // (200+31+20)+5 — EV-80 equiv
  });

  // max HPs as reported by the server in real gen9championsrandombattle replays (e.g. 2714477327, 2714494410),
  // computed here w/ the stat points omitted (i.e. falling back to the Champions Randoms default of 11)
  it.each([
    ['Overqwil', 85, 50, 171],
    ['Hippowdon', 108, 50, 194],
    ['Milotic', 95, 51, 184],
    ['Tauros-Paldea-Blaze', 75, 50, 161],
    ['Hawlucha', 78, 49, 160],
    ['Altaria', 75, 55, 176],
    ['Thievul', 70, 56, 173],
  ])('omitted stat points match the server HP of a randbats %s (base %i, L%i) = %i', (_name, base, level, expected) => {
    expect(calcPokemonStat(CHAMPS, 'hp', base, undefined, undefined, level)).toBe(expected);
  });

  it('omitted stat points use the Champions Randoms default for Speed too (L50 Overqwil, base 77) = 108', () => {
    expect(calcPokemonStat(CHAMPS, 'spe', 77, undefined, undefined, 50)).toBe(108);
  });
});
