import { type CalcdexPokemon } from '@showdex/interfaces/calc';
import { clamp, nonEmptyObject } from '@showdex/utils/core';

/**
 * Returns the Dynamax HP modifier for the given `pokemon`.
 *
 * * You can directly multiply this value with the current HP to accomodate for Dynamax.
 * * Returns `1` if the Pokemon isn't Dynamaxed.
 *
 * @since 1.1.6
 */
export const getDynamaxHpModifier = (
  pokemon: CalcdexPokemon,
): number => (
  (
    pokemon?.speciesForme
      && pokemon.useMax
      && (
        pokemon.source !== 'server'
          || (nonEmptyObject(pokemon.volatiles) && !('dynamax' in pokemon.volatiles))
      )
  )
    ? 2
    : 1
);

/**
 * Determines if the `pokemon`'s HP is known or a percentage.
 *
 * * HP %'s come in 3 unique flavors: 1, 100 & 1000 ...? LOL
 *
 * @since 1.2.0
 */
export const knownPokemonHp = (
  pokemon: CalcdexPokemon,
  ignoreSource?: boolean,
): boolean => (
  !!pokemon?.speciesForme
    && typeof pokemon.maxhp === 'number'
    && (pokemon.maxhp || 0) > 1 // catches decimal percentages HP (maxhp = 1)
    && (
      (!ignoreSource && pokemon.source === 'server')
        // only allow 100 or 1000 max HP if the Pokemon actually has that much
        || ((pokemon.maxhp === 100 || pokemon.maxhp === 1000) && pokemon.spreadStats?.hp === pokemon.maxhp)
    )
);

/**
 * Calculates the `pokemon`'s max HP value.
 *
 * @since 1.1.6
 */
export const calcPokemonMaxHp = (
  pokemon: CalcdexPokemon,
): number => {
  if (!pokemon?.speciesForme || !pokemon.maxhp) {
    return 0;
  }

  const { maxhp, spreadStats } = pokemon;
  const dmaxMod = getDynamaxHpModifier(pokemon);

  return Math.floor((spreadStats?.hp || maxhp || 0) * dmaxMod);
};

/**
 * Calculates the `pokemon`'s current HP value.
 *
 * @since 1.1.6
 */
export const calcPokemonCurrentHp = (
  pokemon: CalcdexPokemon,
  ignoreDirty?: boolean,
): number => {
  if (!pokemon?.speciesForme || (!pokemon.hp && (ignoreDirty || !pokemon.dirtyHp))) {
    return 0;
  }

  const {
    hp: currentHp,
    dirtyHp,
    maxhp: rawMaxHp,
    spreadStats,
  } = pokemon;

  const known = knownPokemonHp(pokemon);
  const maxHp = known ? rawMaxHp : (spreadStats?.hp || 100);
  const hp = (ignoreDirty ? null : dirtyHp) ?? (known ? currentHp : ((currentHp / (rawMaxHp || 1)) * maxHp));
  const dmaxMod = getDynamaxHpModifier(pokemon);

  return Math.floor(hp * dmaxMod);
};

/**
 * Calculates the percentage of the Pokemon's remaining HP as a decimal between `0` & `1`, both inclusive.
 *
 * * You'll need to multiply this percentage with the actual max HP value to estimate
 *   the Pokemon's remaining HP value.
 *   - Actual max HP value can be derived from the `maxhp` of a `ServerPokemon` or
 *     calculating the HP stat value after EVs/IVs/nature are applied.
 * * As of v1.1.6, this no longer accepts `Showdown.Pokemon`.
 *   - At this point, the React side no longer has access to the `Showdown.Battle` object,
 *     but rather a parsed version of it via Redux dispatches.
 *
 * @since 0.1.0
 */
export const calcPokemonHpPercentage = (
  pokemon: CalcdexPokemon,
  ignoreDirty?: boolean,
): number => {
  if (!pokemon?.speciesForme) {
    return 0;
  }

  const maxHp = calcPokemonMaxHp(pokemon);

  if (!maxHp) {
    return 0;
  }

  const currentHp = calcPokemonCurrentHp(pokemon, ignoreDirty);

  return clamp(0, currentHp / maxHp, 1);
};
