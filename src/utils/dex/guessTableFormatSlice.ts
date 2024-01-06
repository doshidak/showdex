// import { parseBattleFormat } from './parseBattleFormat';

/*
 * Known mappings of **genless** formats to `BattleTeambuilderTableFormatCode`'s.
 *
 * @since 1.2.0
 */
// const KnownMappings: Record<string, Showdown.BattleTeambuilderTableFormatCode> = {
//   anythinggoes: 'AG',
//   bdspou: 'OU',
//   bdspru: 'RU',
//   bdspubers: 'Uber',
//   bdspuu: 'UU',
//   caplc: 'CAP LC',
//   doubleslc: 'LC',
//   doublesnu: 'DNU',
//   doublesou: 'DOU',
//   doublesubers: 'Uber',
//   doublesuu: 'DUU',
//   dreamworldou: 'OU',
//   japaneseou: 'OU',
//   lc: 'LC',
//   lcuu: 'UU',
//   letsgoou: 'OU',
//   nationaldex: 'OU',
//   nationaldexag: 'AG',
//   nationaldexru: 'RU',
//   nationaldexubers: 'Uber',
//   nationaldexuu: 'UU',
//   nextou: 'OU',
//   nfe: 'NFE',
//   nu: 'NU',
//   ou: 'OU',
//   oublitz: 'OU',
//   pu: 'PU',
//   ru: 'RU',
//   stadiumou: 'OU',
//   tradebacksou: 'OU',
//   ubers: 'Uber',
//   ubersuu: 'UU',
//   uu: 'UU',
//   vgc: 'Regular',
//   zu: 'ZU',
// };

/**
 * Known mappings of format matchers to `BattleTeambuilderTableFormatCode[]`'s.
 *
 * * ya this more cray than I initially thought o_O
 * * Each code should be used as fallbacks via logical OR's (i.e., `||`).
 * * See link below as to why the funky typing.
 *
 * @see https://github.com/smogon/pokemon-showdown-client/blob/7c015469da5fd83bed8c283ed3c9e908796d3c97/play.pokemonshowdown.com/src/battle-dex-search.ts#L992-L1042
 * @since 1.2.1
 */
const KnownFormatSlices: [
  test: RegExp,
  ...codes: Showdown.BattleTeambuilderTableFormatCode[],
][] = [
  [/ubers?(?:uu)?|nationaldexdoubles/, 'Uber'],
  [/vgc20(?:10|16|19|22)|(?:bss|battlespot|battlestadium).*(?:series(?:10|11)$)/, 'Restricted Legendary'],
  [/(?:bss|battlespot|battlestadium).*series13$/, 'CAP'], // refers to index 0 in `
  [/vgc\d{2,4}|bss|battlespot|battlestadium/, 'Regular'],
  [/bdsp|letsgo|stadium/, 'Uber'],
  [/mono(?:type|threat)/, 'Uber'],
  [/doublesubers/, 'DUber'],
  [/doublesou/, 'DOU'],
  [/doublesuu/, 'DUU'],
  [/doublesnu/, 'DNU', 'DUU'],
  [/ou/, 'OU'], // ordering is purposefully after all the d[ou]bles
  [/uu|gen3ru/, 'UU'],
  [/ru/, 'RU', 'UU'],
  [/nu/, 'NU', 'RU', 'UU'],
  [/pu/, 'PU', 'NU'],
  [/zu/, 'ZU', 'PU', 'NU'],
  [/(?<!cap)lc/, 'LC'],
  [/caplc/, 'CAP LC'], // special case, handled separately if detected
  [/cap/, 'CAP'], // also special case ('CAP' isn't an actual BattleTeambuilderTableFormat key)
  [/^gen9.*(?:hackmons|bh$)/, 'CAP'], // refers to index 0 in `bh` for Mythical Pokemon
  [/hackmons|(?:bh$)/, 'AG', 'Uber'],
  [/anythinggoes|(?:^gen\dag)|(?:ag$)/, 'AG'],
];

/**
 * Attempts to guess the `BattleTeambuilderTableFormatCode` from the provided `format`.
 *
 * * Primarily used to slice the `tiers[]` array from the index value in `formatSlices`.
 * * Key in `formatSlices` to access the `tiers[]` index value can be returned by this utility.
 *   - As of v1.2.1, this returns an array of them now (after reviewing the actual client implementation).
 *   - Each one should be logically OR'd as the first argument to `slice()`.
 *   - Only exceptions are CAP formats (including CAP LC), which require special handling.
 *   - Additionally, any non-CAP formats returning a `'CAP'` key indicates index 0 (i.e., don't slice anything).
 * * Guaranteed to return an empty array.
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
): Showdown.BattleTeambuilderTableFormatCode[] => {
  if (!format) {
    return [];
  }

  const [
    ,
    ...codes
  ] = KnownFormatSlices.find(([r]) => r.test(format)) || ([null] as typeof KnownFormatSlices[number]);

  return codes;
};
