import { type ItemName } from '@smogon/calc';
import { type CalcdexPokemon } from '@showdex/interfaces/calc';

/**
 * Determine what the provided `pokemon`'s species forme should be.
 *
 * * If the `pokemon` is transformed, its `transformedForme` will take precedence, unless `ignoreTransformed` is `true`.
 * * Returns its current transformed/species forme if there's no change in formes.
 *
 * @since 1.2.3
 */
export const determineSpeciesForme = (
  pokemon: CalcdexPokemon,
  ignoreTransformed?: boolean,
): string => {
  if (!pokemon?.speciesForme) {
    return null;
  }

  const {
    speciesForme,
    transformedForme,
    teraType: revealedTeraType,
    dirtyTeraType,
    terastallized,
    item: revealedItem,
    dirtyItem,
  } = pokemon;

  const currentForme = (!ignoreTransformed && transformedForme) || speciesForme;
  const teraType = dirtyTeraType || revealedTeraType;
  const item = dirtyItem ?? revealedItem;

  switch (currentForme) {
    case 'Ogerpon': {
      if (teraType === 'Grass' && terastallized) {
        return 'Ogerpon-Teal-Tera';
      }

      break;
    }

    case 'Ogerpon-Cornerstone': {
      if (teraType === 'Rock' && terastallized && item === 'Cornerstone Mask' as ItemName) {
        return 'Ogerpon-Cornerstone-Tera';
      }

      break;
    }

    case 'Ogerpon-Cornerstone-Tera': {
      if (teraType !== 'Rock' || !terastallized) {
        return 'Ogerpon-Cornerstone';
      }

      break;
    }

    case 'Ogerpon-Hearthflame': {
      if (teraType === 'Fire' && terastallized && item === 'Hearthflame Mask' as ItemName) {
        return 'Ogerpon-Hearthflame-Tera';
      }

      break;
    }

    case 'Ogerpon-Hearthflame-Tera': {
      if (teraType !== 'Fire' || !terastallized) {
        return 'Ogerpon-Hearthflame';
      }

      break;
    }

    case 'Ogerpon-Teal-Tera': {
      if (teraType !== 'Grass' || !terastallized) {
        return 'Ogerpon';
      }

      break;
    }

    case 'Ogerpon-Wellspring': {
      if (teraType === 'Water' && terastallized && item === 'Wellspring Mask' as ItemName) {
        return 'Ogerpon-Wellspring-Tera';
      }

      break;
    }

    case 'Ogerpon-Wellspring-Tera': {
      if (teraType !== 'Water' || !terastallized) {
        return 'Ogerpon-Wellspring';
      }

      break;
    }

    case 'Terapagos': {
      return 'Terapagos-Terastal';
    }

    case 'Terapagos-Stellar': {
      if (teraType !== 'Stellar' || !terastallized) {
        return 'Terapagos-Terastal';
      }

      break;
    }

    case 'Terapagos-Terastal': {
      if (teraType === 'Stellar' && terastallized) {
        return 'Terapagos-Stellar';
      }

      break;
    }

    case 'Zacian': {
      if (item === 'Rusted Sword' as ItemName) {
        return 'Zacian-Crowned';
      }

      break;
    }

    case 'Zamazenta': {
      if (item === 'Rusted Shield' as ItemName) {
        return 'Zamazenta-Crowned';
      }

      break;
    }

    default: {
      break;
    }
  }

  return currentForme;
};
