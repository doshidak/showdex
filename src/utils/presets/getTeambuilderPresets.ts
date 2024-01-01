import { type GenerationNum } from '@smogon/calc';
import { type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
import { formatId } from '@showdex/utils/core';
import { detectGenFromFormat } from '@showdex/utils/dex';
import { readLocalStorageItem } from '@showdex/utils/storage';
import { unpackStorageTeam } from './unpackStorageTeam';
import { detectCompletePreset } from './detectCompletePreset';

/**
 * Reads Teambuilder teams stored in `LocalStorage` and returns `CalcdexPokemonPreset[]`s.
 *
 * * Teambuilder teams are typically stored under the `LocalStorage` key `'showdown_teams'`,
 *   which (in case it changes) is provided by the `LOCAL_STORAGE_SHOWDOWN_TEAMS_KEY` environment variable.
 * * If `format` is provided, only presets of the matching gen derived from the `format` will be returned.
 *   - Otherwise, all presets will be converted, regardless of format.
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
 * * As of v1.1.3, this will first look for Teambuilder teams in `Storage.teams` since they will be populated even
 *   across different origins (e.g., on other `psim.us` sites), falling back to using `LocalStorage` if unpopulated.
 *   - Additionally, `format` was made optional in order to populate the `presets` state of the `teamdexSlice`.
 *
 * @since 1.1.2
 */
export const getTeambuilderPresets = (
  format?: GenerationNum | string,
  // includeTeams = true,
  // includeBoxes = true,
): CalcdexPokemonPreset[] => {
  // if (!format) {
  //   return [];
  // }

  const gen = typeof format === 'string'
    ? detectGenFromFormat(format)
    : format;

  // if (!gen) {
  //   return [];
  // }

  // update (2023/01/24): either grab the teams from Storage.teams (solves the cross-origin issue on other psim sites)
  // or fallback to accessing the teams from LocalStorage
  const packedTeams = (Storage as unknown as Showdown.ClientStorage).teams
    ?.map((team) => (team?.format && team.team ? `${team.format}${(team.capacity ?? 0) > 6 ? '-box' : ''}]${team.name}|${team.team}` : null))
    .filter(Boolean)
    || readLocalStorageItem('local-storage-showdown-teams-key')?.split('\n')
    || [];

  const matchedTeams = packedTeams
    .filter((t) => (
      (!format || !gen || t?.startsWith(`gen${gen}`)) // grab teams from any gen if `format` wasn't provided
        && !formatId(t.slice(t.indexOf(']') + 1)).startsWith('untitled')
        // && (includeTeams || t.slice(0, t.indexOf(']')).endsWith('-box'))
        // && (includeBoxes || !t.slice(0, t.indexOf(']')).endsWith('-box'))
    ));

  if (!matchedTeams?.length) {
    return [];
  }

  return matchedTeams.flatMap(unpackStorageTeam).reduce<CalcdexPokemonPreset[]>((prev, preset) => {
    const { calcdexId } = preset;

    const uniquePreset = !prev.length
      || !prev.some((p) => p.calcdexId === calcdexId);

    if (!uniquePreset) {
      return prev;
    }

    if (detectCompletePreset(preset)) {
      prev.push(preset);
    }

    return prev;
  }, []);
};
