import { type CalcdexPlayerSide } from '@showdex/redux/store';

/**
 * Clones the `sideConditions` object from the `player`.
 *
 * * Shallow-copies the array values of each property in the `player.sideConditions` object.
 *   - Shouldn't be an issue as long as the array values don't contain objects, which shouldn't
 *     be the case, but you never know! LOL
 *
 * @since 1.1.6
 */
export const clonePlayerSideConditions = (
  player: Showdown.Side | CalcdexPlayerSide,
): CalcdexPlayerSide['conditions'] => Object.entries(
  'conditions' in (player || {})
    ? (player as CalcdexPlayerSide)?.conditions || {}
    : 'sideConditions' in (player || {})
      ? (player as Showdown.Side)?.sideConditions || {}
      : {},
).reduce((prev, [key, value]) => {
  prev[key] = Array.isArray(value)
    ? [...value]
    : value; // technically `never, but just in case lmfao

  return prev;
}, {} as CalcdexPlayerSide['conditions']);
