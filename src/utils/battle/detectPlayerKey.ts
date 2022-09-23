import type { CalcdexPlayerKey, CalcdexPokemon } from '@showdex/redux/store';
import { detectPokemonIdent } from './detectPokemonIdent';

/**
 * Attempts to detect the player key from the `ident` of the passed-in `pokemon`.
 *
 * @since 0.1.0
 */
export const detectPlayerKeyFromPokemon = (
  pokemon: DeepPartial<Showdown.Pokemon> | DeepPartial<Showdown.ServerPokemon> | DeepPartial<CalcdexPokemon> = {},
): CalcdexPlayerKey => {
  const ident = detectPokemonIdent(pokemon);

  if (!ident || !/^p\d+:/.test(ident)) {
    return null;
  }

  return <CalcdexPlayerKey> ident.slice(0, ident.indexOf(':'));
};

/**
 * Attempts to detect the player key of the logged-in user from the passed-in `battle`.
 *
 * * If no user is logged in, `null` will be returned.
 * * If the logged-in user is not a player in the battle, `null` will also be returned.
 *
 * @since 1.0.2
 */
export const detectAuthPlayerKeyFromBattle = (
  battle: DeepPartial<Showdown.Battle>,
): CalcdexPlayerKey => {
  if (typeof app === 'undefined') {
    return null;
  }

  const authName = app.user?.attributes?.name;

  if (!authName) {
    return null;
  }

  const { sides } = battle || {};

  const authSide = sides?.find?.((s) => 'name' in (s || {}) && [
    s.id,
    s.name,
  ].filter(Boolean).includes(authName));

  if (!authSide?.sideid) {
    return null;
  }

  return authSide.sideid;
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
  battle: DeepPartial<Showdown.Battle>,
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
