import { type ItemName, type MoveName } from '@smogon/calc';
import { PokemonSpecialZMoves, PokemonZMoves } from '@showdex/consts/dex';
import { getDexForFormat } from './getDexForFormat';

/**
 * Returns the corresponding Z move for a given move.
 *
 * * Prior to v1.0.1, this would return the corresponding Z move for any Z-powerable moves, regardless of the
 *   provided `config.itemName`.
 *   - As of v1.0.1, if `config.itemName` is provided & `config.itemOnly` is `true`, only the move with the same
 *     `zMoveType` as the item will return the Z move.
 *   - Providing a falsy value for `config.itemOnly` (default) will function the same pre-v1.0.1.
 *   - Note that `config.itemOnly` only has an effect if `config.itemName` is valid.
 * * As of v1.2.0, you can provide the optional `config.moveType` to specify a dynamic type for the correct Z move.
 *   - This is for moves like *Weather Ball*, which has some interesting interactions with the Z mechanic.
 *   - According to the Bulbapedia entry, "when used as a Z-Move with *Normalium Z*, *Weather Ball* will be turned into
 *     *Breakneck Blitz*, but then *Breakneck Blitz* will turn into the Z-Move of the type corresponding to the type
 *     *Weather Ball* would be in that weather."
 *   - It also remarks that "this does not occur if *Weather Ball* is turned into a Z-Move via another move like
 *     *Sleep Talk*," but fucc it lmao.
 *
 * @see https://github.com/smogon/damage-calc/blob/bdf9e8c39fec7670ed0ce64e1fb58d1a4dc83b73/calc/src/move.ts#L191
 * @see https://bulbapedia.bulbagarden.net/wiki/Weather_Ball_(move)#Generation_V_onwards
 * @since 0.1.2
 */
export const getZMove = (
  moveName: MoveName,
  config?: {
    moveType?: Showdown.TypeName;
    item?: ItemName;
    itemOnly?: boolean;
  },
): MoveName => {
  const dex = getDexForFormat();
  const dexMove = dex?.moves.get(moveName);

  if (!dexMove?.exists) {
    return null;
  }

  const {
    zMove,
    name: dexMoveName,
    type: dexMoveType,
  } = dexMove;

  const {
    moveType: configMoveType,
    item: itemName,
    itemOnly,
  } = config || {};

  const move = (dexMoveName as MoveName) || moveName;
  const moveType = configMoveType || dexMoveType;

  // make sure the move is Z-powerable
  // (e.g., Close Combat will have a zMove.basePower of 190,
  // but Stealth Rock doesn't have a basePower property in zMove)
  if (!zMove?.basePower) {
    return null;
  }

  // note: for Z moves, Hidden Power will ALWAYS be treated as a Normal type
  if (move.startsWith('Hidden Power')) {
    return PokemonZMoves.Normal;
  }

  const {
    exists: itemExists,
    name: dexItemName,
    zMoveType: itemZMoveType,
    // megaEvolves,
  } = dex.items.get(itemName) || {};

  const item = (itemExists && (dexItemName as ItemName || itemName)) || null;

  // if (!megaEvolves) {
  //   return null;
  // }

  // check for speical Z moves
  if (item && PokemonSpecialZMoves?.[move]?.[item]) {
    return PokemonSpecialZMoves[move][item];
  }

  // if an itemName was provided & the item's Z typing doesn't match the move's typing,
  // don't bother providing the corresponding Z move (by returning null)
  if (itemOnly && item && (!itemZMoveType || moveType !== itemZMoveType)) {
    return null;
  }

  return PokemonZMoves[moveType];
};
