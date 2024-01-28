import { type Terrain } from '@smogon/calc';
import { type CalcdexPokemon } from '@showdex/interfaces/calc';

/**
 * Determines what `Terrain` the provided `pokemon` could invoke.
 *
 * * `null` is returned if determined to invoke nothing.
 *
 * @see https://github.com/smogon/damage-calc/blob/93d84dde21a0ec33a4ec280e896e810182d54cd5/src/js/shared_controls.js#L379-L413
 * @since 1.2.3
 */
export const determineTerrain = (
  pokemon: CalcdexPokemon,
): Terrain => {
  if (!pokemon?.speciesForme) {
    return null;
  }

  const {
    ability: revealedAbility,
    dirtyAbility,
  } = pokemon;

  const ability = dirtyAbility || revealedAbility;

  switch (ability) {
    case 'Electric Surge':
    case 'Hadron Engine': {
      return 'Electric';
    }

    case 'Grassy Surge': {
      return 'Grassy';
    }

    case 'Misty Surge': {
      return 'Misty';
    }

    case 'Psychic Surge': {
      return 'Psychic';
    }

    default: {
      break;
    }
  }

  return null;
};
