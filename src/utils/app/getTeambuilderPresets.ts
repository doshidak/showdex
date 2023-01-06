import { formatId, unpackStorageTeam } from '@showdex/utils/app';
import { detectGenFromFormat, detectLegacyGen } from '@showdex/utils/battle';
import { env } from '@showdex/utils/core';
import type { GenerationNum } from '@smogon/calc';
import type { CalcdexPokemonPreset } from '@showdex/redux/store';

/**
 * Reads Teambuilder teams stored in `LocalStorage` and returns `CalcdexPokemonPreset[]`s of matching gens
 * detected from the provided `format`.
 *
 * * Teambuilder teams are typically stored under the `LocalStorage` key `'showdown_teams'`,
 *   which (in case it changes) is provided by the `STORAGE_TEAMBUILDER_KEY` environment variable.
 * * You'll need to sift through the returned array to grab presets for specific Pokemon.
 *   - Recommended you use this in conjunction with `getPresetFormes()` to make sure you're grabbing
 *     the correct presets for the Pokemon's `speciesForme`.
 *   - For `Showdown.ServerPokemon`, recommended that you pass this utility's return value into
 *     `guessTeambuilderPreset()`, which will conveniently find and verify a matching Teambuilder preset.
 * * Note that the same presets for a Pokemon across different teams will only be included once.
 *   - Sameness is determined by the preset's `calcdexId`, which does not take the team names into account!
 *   - See `calcPresetCalcdexId()` for the actual preset properties that are taken into account.
 * * Only presets that meet the following conditions will be included:
 *   - Team name does not start with "Untitled" (if you didn't name it, the presets are probably trash).
 *   - Moves aren't empty.
 *   - EVs, in non-legacy gens, are fully allocated.
 * * Not recommended you use this for Randoms formats!
 * * Guaranteed to at least return an empty array (i.e., `[]`) if reading fails at any point.
 *
 * @since 1.1.2
 */
export const getTeambuilderPresets = (
  format: GenerationNum | string,
  // includeTeams = true,
  // includeBoxes = true,
): CalcdexPokemonPreset[] => {
  const teambuilderKey = env('storage-teambuilder-key');

  if (!format || typeof localStorage === 'undefined' || !teambuilderKey) {
    return [];
  }

  const gen = typeof format === 'string'
    ? detectGenFromFormat(format)
    : format;

  if (!gen) {
    return [];
  }

  const legacy = detectLegacyGen(format);

  const packedTeams = localStorage.getItem(teambuilderKey);
  const matchedTeams = packedTeams
    ?.split('\n')
    .filter((t) => (
      t?.startsWith(`gen${gen}`)
        && !formatId(t.slice(t.indexOf(']') + 1)).startsWith('untitled')
        // && (includeTeams || t.slice(0, t.indexOf(']')).endsWith('-box'))
        // && (includeBoxes || !t.slice(0, t.indexOf(']')).endsWith('-box'))
    ));

  if (!matchedTeams?.length) {
    return [];
  }

  const maxLegalEvs = legacy
    ? 0 // EVs don't exist in legacy gens, so this value shouldn't even be used
    : env.int('calcdex-pokemon-max-legal-evs', 0);

  return matchedTeams.flatMap(unpackStorageTeam).reduce((prev, preset) => {
    const {
      calcdexId,
      moves,
      evs,
    } = preset;

    const uniquePreset = !prev.length
      || !prev.some((p) => p.calcdexId === calcdexId);

    if (!uniquePreset) {
      return prev;
    }

    const validPreset = !!moves?.length
      && (legacy || Object.values(evs || {}).reduce((sum, val) => sum + (val || 0), 0) >= maxLegalEvs);

    if (validPreset) {
      prev.push(preset);
    }

    return prev;
  }, <CalcdexPokemonPreset[]> []);
};
