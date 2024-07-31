import { type CalcdexPokemon, type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
import { replaceBehemothMoves } from '@showdex/utils/battle';
import { flattenAlts } from './flattenAlts';

/**
 * Attempts to find from the provided `usages[]` a matching `'usage'`-sourced `CalcdexPokemonPreset` for the given `pokemon`.
 *
 * * Returns the first usage if the `pokemon` has no `altMoves[]` / `moves[]` or there was only 1 usage preset provided.
 *   - Otherwise, the matched usage preset must have all the moves present in the `pokemon`'s `altMoves[]` (or if none, `moves[]`).
 * * Assumes that the provided `usages[]` are already pre-selected for this `pokemon`.
 *   - If not, make sure you use `selectPokemonPresets()` first w/ the `config.source` set to `'usage'`.
 * * Returns `null` if no matching usage preset was found.
 *
 * @since 1.2.4
 */
export const findMatchingUsage = (
  usages: CalcdexPokemonPreset[],
  pokemon: Pick<CalcdexPokemon, 'altMoves' | 'moves' | 'speciesForme'>,
): CalcdexPokemonPreset => {
  if (!usages?.length || !pokemon?.speciesForme) {
    return null;
  }

  if (usages.length === 1) {
    return usages[0];
  }

  const moves = replaceBehemothMoves(
    pokemon.speciesForme,
    pokemon.altMoves?.length ? flattenAlts(pokemon.altMoves) : pokemon.moves,
  );

  return moves?.length ? usages.find((usage) => {
    if (!usage?.calcdexId || usage.source !== 'usage' || !usage.altMoves.length) {
      return false;
    }

    const pool = replaceBehemothMoves(usage.speciesForme, flattenAlts(usage.altMoves));

    // update (2024/07/30): in Randoms only, we should make sure the usage's altMoves[] has the same length as moves[] !!
    // ran into this funny little Gen 9 Randoms preset for Toxicroak:
    // moves (from the "Setup Sweeper" preset) = ['Close Combat', 'Earthquake', 'Gunk Shot', 'Sucker Punch', 'Swords Dance'],
    // usage[0].altMoves = [['Close Combat', 1], ['Gunk Shot', 1], ['Knock Off', 1], ['Sucker Punch', 0.3579], ['Swords Dance', 0.3478], ['Earthquake', 0.2944]]
    // usage[1].altMoves = [['Close Combat', 1], ['Gunk Shot', 1], ['Swords Dance', 1], ['Earthquake', 0.6912], ['Sucker Punch', 0.3088]]
    // (usage[1] is actually the correct one, but usage[0] also matches, so it gets selected & incorrectly shows 'Knock Off' in the dropdown LOL)
    return moves.every((m) => pool.includes(m))
      && (!usage.format?.includes('random') || !pokemon.altMoves?.length || pool.length === moves.length);
  }) : usages[0];
};
