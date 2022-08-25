import { clamp } from '@showdex/utils/core';
import type { CalcdexPokemon } from '@showdex/redux/store';

/**
 * Name is a bit misleading because this returns the **percentage** of the Pokemon's
 * remaining HP, not the actual numerical value.
 *
 * * You'll need to multiply this percentage with the actual max HP value to estimate
 *   the Pokemon's remaining HP value.
 *   - Actual max HP value can be derived from the `maxhp` of a `ServerPokemon` or
 *     calculating the HP stat value after EVs/IVs/nature are applied.
 *
 * @todo Rename this into what it actually does lol
 * @since 0.1.0
 */
export const calcPokemonHp = (
  pokemon: DeepPartial<Showdown.Pokemon> | DeepPartial<CalcdexPokemon> = {},
): CalcdexPokemon['hp'] => {
  const hp = pokemon.hp || 0;

  const maxHp = 'spreadStats' in pokemon && pokemon.serverSourced && !pokemon.transformedForme
    ? pokemon.spreadStats.hp || pokemon.maxhp || 1
    : pokemon.maxhp || 1;

  return clamp(0, hp / maxHp, 1);
};
