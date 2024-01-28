import { type CalcdexPokemon } from '@showdex/interfaces/calc';

/**
 * Determines what the provided `pokemon`'s non-volatile status condition should be.
 *
 * * Returns its `dirtyStatus` if there's no change in its status.
 *   - If the `pokemon` currently has a battle-reported `status`, `null` will be returned.
 *   - This is intended to populate the `dirtyStatus` during user-invoked updates.
 *
 * @see https://github.com/smogon/damage-calc/blob/93d84dde21a0ec33a4ec280e896e810182d54cd5/src/js/shared_controls.js#L421-L441
 * @since 1.2.3
 */
export const determineNonVolatile = (
  pokemon: CalcdexPokemon,
): CalcdexPokemon['dirtyStatus'] => {
  if (!pokemon?.speciesForme) {
    return pokemon?.dirtyStatus;
  }

  const {
    status: currentStatus,
    dirtyStatus,
    item: revealedItem,
    dirtyItem,
  } = pokemon;

  const item = dirtyItem ?? revealedItem;

  switch (item) {
    case 'Flame Orb': {
      return 'brn';
    }

    case 'Toxic Orb': {
      return 'tox';
    }

    default: {
      break;
    }
  }

  return (!!currentStatus && dirtyStatus) || null;
};
