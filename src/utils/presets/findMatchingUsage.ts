import { type CalcdexPokemon, type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
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
  pokemon: CalcdexPokemon,
): CalcdexPokemonPreset => {
  if (!usages?.length || !pokemon?.speciesForme) {
    return null;
  }

  if (usages.length === 1) {
    return usages[0];
  }

  const moves = pokemon.altMoves?.length ? flattenAlts(pokemon.altMoves) : pokemon.moves;

  return moves?.length ? usages.find((usage) => {
    if (!usage?.calcdexId || usage.source !== 'usage' || !usage.altMoves.length) {
      return false;
    }

    const pool = flattenAlts(usage.altMoves);

    return moves.every((m) => pool.includes(m));
  }) : usages[0];
};
