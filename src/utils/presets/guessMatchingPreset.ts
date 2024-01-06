import { type CalcdexPokemon, type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
import { detectGenFromFormat } from '@showdex/utils/dex';
import { flattenAlts } from './flattenAlts';

/**
 * Attempts to find the best matching preset based on what's been revealed for the `pokemon` in battle.
 *
 * * Only presets sourced from `'smogon'` will be considered.
 *   - As of v1.2.1, `'bundle'` sources will also be considered.
 * * Best matching preset is based on the following conditions:
 *   - Matching items (if applicable to the gen & revealed),
 *   - Matching abilities (if applicable to the gen & revealed), and
 *   - Matching moves (only the `revealedMoves[]` of the `pokemon` will be considered).
 * * If any of the args are falsy or `presets` is empty, `null` will be returned.
 * * At the very least, this will return the first element of `presets`.
 * * Matching doesn't take into account user-provided dirty properties, only battle-reported ones.
 * * Primarily used by the auto-preset mechanism in `CalcdexPokeProvider`.
 *
 * @since 1.1.3
 */
export const guessMatchingPreset = (
  format: string,
  presets: CalcdexPokemonPreset[],
  pokemon: CalcdexPokemon,
): CalcdexPokemonPreset => {
  const gen = detectGenFromFormat(format);

  if (!format || !gen || !presets?.length || !pokemon?.speciesForme) {
    return null;
  }

  const smogonPresets = presets.filter((p) => ['bundle', 'smogon'].includes(p?.source));

  if (!smogonPresets.length) {
    return null;
  }

  return smogonPresets.find((p) => (
    (gen < 2 || (
      !(pokemon.prevItem || pokemon.item)
        || [p.item, ...flattenAlts(p.altItems)].includes(pokemon.prevItem || pokemon.item)
    ))
      && (gen < 3 || (
        !pokemon.ability
          || [p.ability, ...flattenAlts(p.altMoves)].includes(pokemon.ability)
      ))
      && (
        !pokemon.revealedMoves?.length
          || pokemon.revealedMoves.every((m) => [...p.moves, ...flattenAlts(p.altMoves)].includes(m))
      )
  )) || presets[0];
};
