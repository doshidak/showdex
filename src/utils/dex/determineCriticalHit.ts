import { type GenerationNum, type MoveName } from '@smogon/calc';
import { type CalcdexPokemon } from '@showdex/interfaces/calc';
import { alwaysCriticalHits } from './alwaysCriticalHits';
import { getMaxMove } from './getMaxMove';
import { getZMove } from './getZMove';

/**
 * Determines whether the passed-in `moveName` should be a critical hit.
 *
 * * Meant to be passed to the `isCrit` property of `SmogonMove` in `createSmogonMove()`.
 * * Purposefully does not take into account any user-defined `moveOverrides` in the passed-in `pokemon`.
 *
 * @since 1.0.6
 */
export const determineCriticalHit = (
  pokemon: CalcdexPokemon,
  moveName: MoveName,
  config?: {
    format?: string | GenerationNum;
  },
): boolean => {
  if (!pokemon?.speciesForme) {
    return;
  }

  const {
    speciesForme,
    ability: revealedAbility,
    dirtyAbility,
    item: revealedItem,
    dirtyItem,
  } = pokemon || {};

  const { format } = config || {};

  const ability = dirtyAbility ?? revealedAbility;
  const item = dirtyItem ?? revealedItem;

  return (
    alwaysCriticalHits(moveName, format)
      && (!pokemon.useZ || !getZMove(moveName, { item }))
      && (!pokemon.useMax || !getMaxMove(moveName, { speciesForme, ability }))
  ) || pokemon.criticalHit;
};
