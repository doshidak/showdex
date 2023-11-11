import { type CalcdexPlayerSideConditions } from '@showdex/interfaces/calc';

/**
 * Clones the `sideConditions` object from the `player`.
 *
 * * Shallow-copies the array values of each property in the `player.sideConditions` object.
 *   - Shouldn't be an issue as long as the array values don't contain objects, which shouldn't
 *     be the case, but you never know! LOL
 * * Update (2023/09/27): TIL when you partial the object way too hard, so TypeScript didn't see anything
 *   wrong with me passing in `playerState.conditions` (of type `CalcdexPlayerSideConditions`), which can be
 *   an empty object, for a `CalcdexPlayerSide`, which can also be an empty object.
 *   - oopsies LOL
 *
 * @since 1.1.6
 */
export const clonePlayerSideConditions = (
  conditions: CalcdexPlayerSideConditions,
): CalcdexPlayerSideConditions => Object.entries(conditions || {})
  .reduce((prev, [key, value]) => {
    prev[key] = Array.isArray(value)
      ? [...value]
      : value; // technically `never`, but just in case lmfao

    return prev;
  }, {} as CalcdexPlayerSideConditions);
