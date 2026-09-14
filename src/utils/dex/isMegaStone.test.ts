import { describe, expect, it } from 'vitest';
import { isMegaStone } from './isMegaStone';

describe('isMegaStone()', () => {
  it('detects -ite Mega stones', () => {
    expect(isMegaStone('Venusaurite')).toBe(true);
    expect(isMegaStone('Blastoisinite')).toBe(true);
    expect(isMegaStone('Gengarite')).toBe(true);
    expect(isMegaStone('Sceptilite')).toBe(true);
  });

  it('detects the X/Y Mega stones (Charizard, Mewtwo)', () => {
    expect(isMegaStone('Charizardite X')).toBe(true);
    expect(isMegaStone('Charizardite Y')).toBe(true);
    expect(isMegaStone('Mewtwonite Y')).toBe(true);
  });

  it('detects the Z Mega stones (Absol, Garchomp, Lucario)', () => {
    expect(isMegaStone('Absolite Z')).toBe(true);
    expect(isMegaStone('Garchompite Z')).toBe(true);
    expect(isMegaStone('Lucarionite Z')).toBe(true);
  });

  it('excludes Eviolite (the -ite NFE trap)', () => {
    expect(isMegaStone('Eviolite')).toBe(false);
  });

  it('excludes non-stone items & empties', () => {
    expect(isMegaStone('Leftovers')).toBe(false);
    expect(isMegaStone('Focus Sash')).toBe(false);
    expect(isMegaStone('Life Orb')).toBe(false);
    expect(isMegaStone('')).toBe(false);
    expect(isMegaStone(undefined as unknown as string)).toBe(false);
  });
});
