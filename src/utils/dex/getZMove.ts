import { PokemonSpecialZMoves, PokemonZMoves } from '@showdex/consts/pokemon';
import { formatId } from '@showdex/utils/app';
import { logger } from '@showdex/utils/debug';
import type { ItemName, MoveName } from '@smogon/calc/dist/data/interface';

const l = logger('@showdex/utils/dex/getZMove');

/**
 * Returns the corresponding Z move for a given move.
 *
 * * Prior to v1.0.1, this would return the corresponding Z move for any Z-powerable moves, regardless of the
 *   provided `itemName`.
 *   - Now, if `itemName` is provided and `itemOnly` is `true`, only the move with the same `zMoveType` as the item will return the Z move.
 *   - Providing a falsy value for `itemOnly` (default) will function the same pre-v1.0.1.
 *   - Note that `itemOnly` only has an effect if `itemName` is valid.
 *
 * @see https://github.com/smogon/damage-calc/blob/bdf9e8c39fec7670ed0ce64e1fb58d1a4dc83b73/calc/src/move.ts#L191
 * @since 0.1.2
 */
export const getZMove = (
  // dex: Generation,
  moveName: MoveName,
  itemName?: ItemName,
  itemOnly?: boolean,
): MoveName => {
  // if (typeof dex?.moves?.get !== 'function') {
  if (typeof Dex === 'undefined') {
    if (__DEV__) {
      l.warn(
        'Global Dex object is unavailable.',
        // 'Passed-in dex object is invalid cause dex.moves.get() is not a function',
        // '\n', 'typeof dex.moves.get', typeof dex?.moves?.get,
        '\n', 'moveName', moveName,
        '\n', 'itemName', itemName,
        '\n', 'itemOnly?', itemOnly,
        '\n', '(You will only see this warning on development.)',
      );
    }

    return null;
  }

  const move = Dex.moves.get(moveName);

  if (!move?.exists) {
    if (__DEV__) {
      l.warn(
        'Provided moveName is not a valid move!',
        '\n', 'move', move,
        '\n', 'moveName', moveName,
        '\n', 'itemName', itemName,
        '\n', 'itemOnly?', itemOnly,
        '\n', '(You will only see this warning on development.)',
      );
    }

    return null;
  }

  // make sure the move is Z-powerable
  // (e.g., Close Combat will have a zMove.basePower of 190,
  // but Stealth Rock doesn't have a basePower property in zMove)
  if (!move?.zMove?.basePower) {
    return null;
  }

  const moveId = formatId(move.name);

  // note: for Z moves, Hidden Power will ALWAYS be treated as a Normal type
  if (moveId.includes('hiddenpower')) {
    return PokemonZMoves.Normal;
  }

  const item = itemName ? Dex.items.get(itemName) : null;
  const itemId = item?.exists && item.name ? formatId(item.name) : null;

  // if (!item?.megaEvolves) {
  //   return null;
  // }

  // check for speical Z moves
  if (itemId && PokemonSpecialZMoves[moveId] && PokemonSpecialZMoves[moveId][itemId]) {
    return PokemonSpecialZMoves[moveId][itemId];
  }

  // if an itemName was provided and the item's Z typing doesn't match the move's typing,
  // don't bother providing the corresponding Z move (by returning null)
  if (itemOnly && item?.exists && (!item.zMoveType || move.type !== item.zMoveType)) {
    return null;
  }

  return PokemonZMoves[move.type];
};
