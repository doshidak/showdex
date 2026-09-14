import { describe, expect, it } from 'vitest';
import { getMegaFormeForItem } from './getMegaFormeForItem';

describe('getMegaFormeForItem()', () => {
  it('picks the lone Mega forme for a plain Mega stone', () => {
    expect(getMegaFormeForItem('Venusaurite', ['Venusaur-Mega'])).toBe('Venusaur-Mega');
  });

  it('picks the X/Y forme matching the stone suffix', () => {
    const formes = ['Charizard-Mega-X', 'Charizard-Mega-Y'];

    expect(getMegaFormeForItem('Charizardite X', formes)).toBe('Charizard-Mega-X');
    expect(getMegaFormeForItem('Charizardite Y', formes)).toBe('Charizard-Mega-Y');
  });

  it('picks the -Mega-Z forme for a Z stone', () => {
    expect(getMegaFormeForItem('Garchompite Z', ['Garchomp-Mega', 'Garchomp-Mega-Z'])).toBe('Garchomp-Mega-Z');
    expect(getMegaFormeForItem('Absolite Z', ['Absol-Mega', 'Absol-Mega-Z'])).toBe('Absol-Mega-Z');
    expect(getMegaFormeForItem('Lucarionite Z', ['Lucario-Mega', 'Lucario-Mega-Z'])).toBe('Lucario-Mega-Z');
  });

  it('picks the unsuffixed -Mega forme for a plain stone when a -Mega-Z also exists', () => {
    expect(getMegaFormeForItem('Garchompite', ['Garchomp-Mega-Z', 'Garchomp-Mega'])).toBe('Garchomp-Mega');
    expect(getMegaFormeForItem('Absolite', ['Absol-Mega-Z', 'Absol-Mega'])).toBe('Absol-Mega');
  });

  it('falls back to the first Mega forme when no forme matches the suffix', () => {
    expect(getMegaFormeForItem('Garchompite Z', ['Garchomp-Mega'])).toBe('Garchomp-Mega');
  });

  it('returns null for non-stones, Eviolite, empties & no formes', () => {
    expect(getMegaFormeForItem('Leftovers', ['Garchomp-Mega'])).toBe(null);
    expect(getMegaFormeForItem('Eviolite', ['Garchomp-Mega'])).toBe(null);
    expect(getMegaFormeForItem('', ['Garchomp-Mega'])).toBe(null);
    expect(getMegaFormeForItem('Garchompite', [])).toBe(null);
    expect(getMegaFormeForItem('Garchompite', null)).toBe(null);
  });
});
