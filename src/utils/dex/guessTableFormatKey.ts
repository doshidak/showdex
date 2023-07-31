/**
 * Known mappings of formats to the `BattleTeambuilderTableFormat`.
 *
 * * Formats, i.e., the keys of this object, should be used as a search string.
 *
 * @since 1.0.3
 */
const KnownTableMappings: Record<string, Showdown.BattleTeambuilderTableFormat> = {
  bdsp: 'gen8bdsp', // for now, 'gen8bdspdoubles*' formats can go to gen8bdsp
  gen8metronome: 'gen8metronome',
  gen8natdex: 'gen8natdex', // unsure what formats would match this, but it's here just in case
  gen8nationaldex: 'gen8natdex', // e.g., 'gen8nationaldex', 'gen8nationaldexubers', 'gen8nationaldexag', etc.
  gen9metronome: 'gen9metronome',
  gen9natdex: 'gen9natdex', // e.g., 'gen9natdexdraft', 'gen9natdex6v6doublesdraft', 'gen9natdexlcdraft', etc.
  gen9nationaldex: 'gen9natdex', // e.g., 'gen9nationaldex', 'gen9nationaldexubers', 'gen9nationaldexag', etc.
  letsgo: 'gen7letsgo',
};

/**
 * Attempts to guess the key in `BattleTeambuilderTable` from the provided `format`.
 *
 * * Primarily used for accessing additional data in the gens available in the global
 *   `BattleTeambuilderTable` object, particularly in `buildItemOptions()` and `getPokemonLearnset()`.
 *
 * @example
 * ```ts
 * guessTableFormatKey('gen8nationaldexag'); // 'gen8natdex' -> BattleTeambuilderTable.gen8natdex
 * guessTableFormatKey('gen8bdspou'); // 'gen8bdsp'
 * guessTableFormatKey('gen9nationaldexag'); // 'gen9natdex'
 * guessTableFormatKey('gen9natdexdraft'); // 'gen9natdex'
 * ```
 * @since 1.0.3
 */
export const guessTableFormatKey = (
  format: string,
): Showdown.BattleTeambuilderTableFormat => {
  if (!format) {
    return null;
  }

  const knownFormat = Object.entries(KnownTableMappings)
    .find(([searchFormat]) => format.includes(searchFormat))?.[1];

  if (knownFormat) {
    return knownFormat;
  }

  // reversing the order so that sub-formats like gen7letsgo comes before gen7
  // (note: there's no gen8, only gen8dlc1. however, there is a gen8doubles and a gen8dlc1doubles,
  // so we can't simply remove 'dlc1'; hence why we're filtering out gen8doubles since it comes before gen8dlc1doubles)
  const genFormatKeys = (Object.keys(BattleTeambuilderTable) as Showdown.BattleTeambuilderTableFormat[])
    .filter((key) => key?.startsWith?.('gen') && key !== 'gen8doubles')
    .sort()
    .reverse();

  return genFormatKeys.find((key) => format.includes(key.replace(/dlc\d?/i, '')));
};
