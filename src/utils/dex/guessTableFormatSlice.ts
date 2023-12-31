import { parseBattleFormat } from './parseBattleFormat';

/**
 * Known mappings of **genless** formats to `BattleTeambuilderTableFormatCode`'s.
 *
 * @since 1.2.0
 */
const KnownMappings: Record<string, Showdown.BattleTeambuilderTableFormatCode> = {
  anythinggoes: 'AG',
  bdspou: 'OU',
  bdspru: 'RU',
  bdspubers: 'Uber',
  bdspuu: 'UU',
  caplc: 'CAP LC',
  doubleslc: 'LC',
  doublesnu: 'DNU',
  doublesou: 'DOU',
  doublesubers: 'Uber',
  doublesuu: 'DUU',
  dreamworldou: 'OU',
  japaneseou: 'OU',
  lc: 'LC',
  lcuu: 'UU',
  letsgoou: 'OU',
  nationaldex: 'OU',
  nationaldexag: 'AG',
  nationaldexru: 'RU',
  nationaldexubers: 'Uber',
  nationaldexuu: 'UU',
  nextou: 'OU',
  nfe: 'NFE',
  nu: 'NU',
  ou: 'OU',
  oublitz: 'OU',
  pu: 'PU',
  ru: 'RU',
  stadiumou: 'OU',
  tradebacksou: 'OU',
  ubers: 'Uber',
  ubersuu: 'UU',
  uu: 'UU',
  vgc: 'Regular',
  zu: 'ZU',
};

/**
 * Attempts to guess the `BattleTeambuilderTableFormatCode` from the provided `format`.
 *
 * * Primarily used to slice the `tiers[]` array from the index value in `formatSlices`.
 * * Key in `formatSlices` to access the `tiers[]` index value can be returned by this utility.
 *
 * @example
 * ```ts
 * guessTableFormatSlice('gen9nationaldex');
 * // 'OU' -> BattleTeambuilderTable.gen9natdex.formatSlices.OU
 * ```
 * @since 1.2.0
 */
export const guessTableFormatSlice = (
  format: string,
): Showdown.BattleTeambuilderTableFormatCode => {
  if (!format) {
    return null;
  }

  const { base } = parseBattleFormat(format);

  // special case cause I don't want to define 'vgc2009', 'vgc2010', 'vgc2011', ...
  if (base.startsWith('vgc')) {
    return KnownMappings.vgc;
  }

  return (
    Object.entries(KnownMappings)
      .find(([f]) => f === base)?.[1]
  ) || null;
};
