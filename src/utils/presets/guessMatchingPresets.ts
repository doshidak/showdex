import { type CalcdexPokemon, type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
import { detectGenFromFormat, detectLegacyGen } from '@showdex/utils/dex';
import { flattenAlts } from './flattenAlts';

/**
 * Attempts to find matching presets based on what's been revealed for the `pokemon` in battle.
 *
 * * Matched presets are based on the following conditions:
 *   - Revealed item (if any in a non-legacy gen) matches the preset's `item` or `altItems[]`,
 *   - Revealed ability (if any in a non-legacy gen) matches the preset's `ability` or `altAbilities[]`,
 *   - All revealed moves (if any) match the preset's `moves[]` or `altMoves[]`.
 * * Matching doesn't take into account user-provided dirty properties, only battle-reported ones.
 * * Assumes that `presets[]` have already been pre-filtered for the `pokemon`'s current forme!
 *   - Otherwise, use the `selectPokemonPresets()` utility from `@showdex/utils/presets` to perform the filtering for you.
 * * Guaranteed to return an empty array.
 *
 * @since 1.1.3
 */
export const guessMatchingPresets = (
  presets: CalcdexPokemonPreset[],
  pokemon: CalcdexPokemon,
  config: {
    format: string;
  },
): CalcdexPokemonPreset[] => {
  const { format } = { ...config };
  const gen = detectGenFromFormat(format);
  const legacy = detectLegacyGen(gen);

  if (!gen || !presets?.length || !pokemon?.speciesForme) {
    return [];
  }

  return presets.filter((p) => (
    (legacy || (
      !(pokemon.prevItem || pokemon.item)
        || [p.item, ...flattenAlts(p.altItems)].includes(pokemon.prevItem || pokemon.item)
    ))
      && (gen < 3 || (
        !pokemon.ability
          || [p.ability, ...flattenAlts(p.altAbilities)].includes(pokemon.ability)
      ))
      && (
        !pokemon.revealedMoves?.length
          || pokemon.revealedMoves.every((m) => [...p.moves, ...flattenAlts(p.altMoves)].includes(m))
      )
  ));
};
