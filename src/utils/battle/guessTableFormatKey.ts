/**
 * Known mappings of formats to the `BattleTeambuilderTableFormat`.
 *
 * * Formats, i.e., the keys of this object, should be used as a search string.
 *
 * @since 1.0.3
 */
const KnownTableMappings: Record<string, Showdown.BattleTeambuilderTableFormat> = {
  bdsp: 'gen8bdsp', // for now, 'gen8bdspdoubles*' formats can go to gen8bdsp
  letsgo: 'gen7letsgo',
  metronome: 'metronome',
  nationaldex: 'natdex',
};

/**
 * Attempts to guess the key in `BattleTeambuilderTable` from the provided `format`.
 *
 * * Primarily used for accessing additional data in the gens available in the global
 *   `BattleTeambuilderTable` object, particularly in `buildItemOptions()` and `getPokemonLearnset()`.
 *
 * @example
 * ```ts
 * guessTableFormatKey('gen8nationaldexag');
 *
 * 'natdex' // i.e., BattleTeambuilderTable.natdex
 * ```
 * @since 1.0.3
 */
export const guessTableFormatKey = (format: string): Showdown.BattleTeambuilderTableFormat => {
  if (!format) {
    return null;
  }

  const [, knownFormat] = Object.entries(KnownTableMappings)
    .find(([searchFormat]) => format.includes(searchFormat))
    || [];

  if (knownFormat) {
    return knownFormat;
  }

  // reversing the order so that sub-formats like gen7letsgo comes before gen7
  // (note: there's no gen8, only gen8dlc1. however, there is a gen8doubles and a gen8dlc1doubles,
  // so we can't simply remove 'dlc1'; hence why we're filtering out gen8doubles since it comes before gen8dlc1doubles)
  const genFormatKeys = <Showdown.BattleTeambuilderTableFormat[]> Object.keys(BattleTeambuilderTable)
    .filter((key) => !!key && key.startsWith('gen') && key !== 'gen8doubles')
    .sort()
    .reverse();

  return genFormatKeys.find((key) => format.includes(key.replace(/dlc\d?/i, '')));
};
