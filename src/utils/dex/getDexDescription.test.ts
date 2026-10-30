import { describe, expect, it } from 'vitest';
import { getDexDescription } from './getDexDescription';

const mockAbility = (
  data?: Partial<Showdown.Ability>,
): Showdown.Ability => ({
  effectType: 'Ability',
  id: 'intimidate',
  name: 'Intimidate',
  exists: true,
  desc: '',
  shortDesc: '',
  ...data,
} as Showdown.Ability);

const mockDex = (
  text?: Showdown.ModdedDex['text'],
): Showdown.ModdedDex => ({ text } as Showdown.ModdedDex);

const textEntry = {
  name: 'Intimidate',
  desc: 'On switch-in, this Pokemon lowers the Attack of opposing Pokemon by 1 stage.',
  shortDesc: 'On switch-in, this Pokemon lowers the Attack of opponents by 1 stage.',
};

describe('getDexDescription()', () => {
  it('reads descriptions from dex.text.get() when available', () => {
    const dex = mockDex({ getLanguage: () => 'en', get: () => textEntry });

    expect(getDexDescription(dex, mockAbility())).toEqual({
      desc: textEntry.desc,
      shortDesc: textEntry.shortDesc,
    });
  });

  it('forwards the lang to dex.text.get() only when provided', () => {
    const calls: unknown[][] = [];
    const dex = mockDex({ getLanguage: () => 'fr', get: (...args) => { calls.push(args); return textEntry; } });
    const ability = mockAbility();

    getDexDescription(dex, ability, 'en');
    getDexDescription(dex, ability);

    expect(calls).toEqual([[ability, 'en'], [ability]]);
  });

  it('falls back to the effect fields on older clients w/o dex.text', () => {
    const ability = mockAbility({ desc: 'old desc', shortDesc: 'old shortDesc' });

    expect(getDexDescription(mockDex(), ability)).toEqual({ desc: 'old desc', shortDesc: 'old shortDesc' });
  });

  it('falls back to the effect fields when dex.text.get() throws', () => {
    const dex = mockDex({
      getLanguage: () => 'en',
      get: () => { throw new ReferenceError('BattleText is not defined'); },
    });

    const ability = mockAbility({ desc: 'old desc', shortDesc: 'old shortDesc' });

    expect(getDexDescription(dex, ability)).toEqual({ desc: 'old desc', shortDesc: 'old shortDesc' });
  });

  it('falls back to the effect fields when the text entry has no descriptions', () => {
    const dex = mockDex({ getLanguage: () => 'en', get: () => ({ name: 'Intimidate' }) });
    const ability = mockAbility({ shortDesc: 'old shortDesc' });

    expect(getDexDescription(dex, ability)).toEqual({ desc: 'old shortDesc', shortDesc: 'old shortDesc' });
  });

  it('fills in a missing desc or shortDesc w/ the other', () => {
    const dex = mockDex({ getLanguage: () => 'en', get: () => ({ name: 'Intimidate', desc: 'only desc' }) });

    expect(getDexDescription(dex, mockAbility())).toEqual({ desc: 'only desc', shortDesc: 'only desc' });
  });

  it('returns nulls for missing or nonexistent effects', () => {
    const dex = mockDex({ getLanguage: () => 'en', get: () => textEntry });

    expect(getDexDescription(dex, null)).toEqual({ desc: null, shortDesc: null });
    expect(getDexDescription(dex, mockAbility({ exists: false }))).toEqual({ desc: null, shortDesc: null });
    expect(getDexDescription(mockDex(), mockAbility())).toEqual({ desc: null, shortDesc: null });
  });
});
