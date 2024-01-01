import { nonEmptyObject } from '@showdex/utils/core';
import { detectGenFromFormat } from './detectGenFromFormat';

/**
 * Known mappings of formats to the `BattleTeambuilderTableFormat`.
 *
 * * Provided `format` will be `test()`'d against the `RegExp`, then the matching string will be `replace()`'d with the
 *   `replacement` string, which is the resulting key that should be accessed in `BattleTeambuilderTable`.
 *
 * @since 1.0.3
 */
const KnownFormats: [test: RegExp, replacement: string][] = [
  [/balancedhackmons/, 'bh'],
  [/bdsp.*(doubles)?/, 'gen8bdsp$1'],
  [/letsgo/, 'gen7letsgo'],
  [/^gen(\d).*lc/, 'gen$1lc'],
  [/^gen(\d).+doubles/, 'gen$1doubles'],
  [/^gen(\d)metronome/, 'gen$1metronome'],
  [/^gen(\d)nat(?:ional)?dex/, 'gen$1natdex'],
  [/^gen(\d)nfe/, 'gen$1nfe'],
  [/^gen(\d)vgc/, 'gen$1vgc'],
  [/^gen(\d)predlc.+(doubles)?/, 'gen$1predlc$2'],
  [/^gen(\d)dlc(\d).+(doubles)?/, 'gen$1dlc$2$3'],
];

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
  if (!format || !nonEmptyObject(BattleTeambuilderTable)) {
    return null;
  }

  // first sniff out any special formats, like gen8bdsp & gen9dlc1
  const knownFormat = KnownFormats.find(([regex]) => regex.test(format));

  if (knownFormat?.length) {
    const [regex, replacement] = knownFormat;
    const [match] = regex.exec(format);
    const key = match?.replace(regex, replacement) as Showdown.BattleTeambuilderTableFormat;

    if (key in BattleTeambuilderTable) {
      return key;
    }
  }

  // current gen (e.g., 'gen9' -- at the time of writing) seems to be in the root BattleTeambuilderTable,
  // while other gens (e.g., 'gen8') will be properties alongside the current gen;
  // i.e., you won't find a 'gen9' BattleTeambuilderTable property, but what you'd normally find inside of it is
  // available in the root of the BattleTeambuilderTable object itself
  const gen = detectGenFromFormat(format);

  // doubles (even of the current gen, e.g., 'gen9doubles') will always be a BattleTeambuilderTable property
  if (format.includes('doubles')) {
    const key = `gen${gen}doubles` as Showdown.BattleTeambuilderTableFormat;

    if (key in BattleTeambuilderTable) {
      return key;
    }
  }

  const key = `gen${gen}` as Showdown.BattleTeambuilderTableFormat;

  if (key in BattleTeambuilderTable) {
    return key;
  }

  // at this point, the `format` might be something like `gen9ou`, so since it's the current gen, we'll return `null` as
  // to fallback to using the root BattleTeambuilderTable properties
  return null;
};
