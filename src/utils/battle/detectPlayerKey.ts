import { type CalcdexPlayerKey } from '@showdex/interfaces/calc';
import { getAuthUsername } from '@showdex/utils/host';
import { detectPokemonIdent } from './detectPokemonIdent';

const PokemonPlayerKeyRegex = /^(p\d)[a-z]?:/;

/* eslint-disable @typescript-eslint/indent */

/**
 * Attempts to detect the player key from the `ident` of the passed-in `pokemon`.
 *
 * @since 0.1.0
 */
export const detectPlayerKeyFromPokemon = <
  TPokemon extends Partial<Showdown.PokemonDetails>,
>(
  pokemon: TPokemon,
): CalcdexPlayerKey => {
  const ident = detectPokemonIdent(pokemon);

  if (!ident) {
    return null;
  }

  return PokemonPlayerKeyRegex.exec(ident)?.[1] as CalcdexPlayerKey;
};

/* eslint-enable @typescript-eslint/indent */

/**
 * Attempts to detect the player key of the logged-in user from the passed-in `battle`.
 *
 * * If no user is logged in, `null` will be returned.
 * * If the logged-in user is not a player in the battle, `null` will also be returned.
 *
 * @since 1.0.2
 */
export const detectAuthPlayerKeyFromBattle = (
  battle: Partial<Showdown.Battle>,
): CalcdexPlayerKey => {
  const authName = getAuthUsername();

  if (!authName) {
    return null;
  }

  const { sides } = battle || {};

  const authSide = sides?.find?.((s) => 'name' in (s || {}) && [
    s.id,
    s.name,
  ].filter(Boolean).includes(authName));

  return authSide?.sideid || null;
};

/**
 * Attempts to detect the player key from the passed-in `battle`.
 *
 * * If a user is logged in and is also a player in the battle, their corresponding `sideid`
 *   will be returned as the player key.
 *   - Opponent key can be determined from the opposite side, i.e., if the player key is `'p1'`,
 *     then the opponent key is `'p2'`, and vice versa.
 *
 * @since 0.1.0
 */
export const detectPlayerKeyFromBattle = (
  battle: Partial<Showdown.Battle>,
): CalcdexPlayerKey => {
  // check if the logged in user is a player in the battle
  const authKey = detectAuthPlayerKeyFromBattle(battle);

  if (authKey) {
    return authKey;
  }

  const {
    myPokemon,
    mySide,
  } = battle || {};

  if (mySide?.sideid) {
    return mySide.sideid;
  }

  const [firstPokemon] = myPokemon || [];

  if (!firstPokemon) {
    return null;
  }

  return detectPlayerKeyFromPokemon(firstPokemon);
};
