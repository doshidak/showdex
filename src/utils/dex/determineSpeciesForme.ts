/**
 * @file `determineSpeciesForme.ts`
 * @author Keith Choison <keith@tize.io>
 * @since 1.2.3
 */

import { type ItemName } from '@smogon/calc';
import { type CalcdexPokemon } from '@showdex/interfaces/calc';

/**
 * Determine what the provided `pokemon`'s species forme should be.
 *
 * * If the `pokemon` is transformed, its `transformedForme` will take precedence, unless `ignoreTransformed` is `true`.
 * * Returns its current transformed / species forme if there's no change in formes.
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
    terastallized,
    item: revealedItem,
    dirtyItem,
  } = pokemon;

  const currentForme = (!ignoreTransformed && transformedForme) || speciesForme;
  const item = dirtyItem ?? revealedItem;

  switch (currentForme) {
    // update (2026/09/07): these used to additionally gate on a specific teraType (& the matching mask), which the
    // sim doesn't do at all -- BattleActions#terastallize() forme-changes on `baseSpecies === 'Ogerpon'` alone, then
    // appends 'tera' to whatever forme is already out (see sim/battle-actions.ts). teraType only decides whether the
    // Terastallization happens *at all*: Ogerpon refuses to Tera into anything outside Fire/Grass/Rock/Water.
    // so an Ogerpon-Wellspring Tera'd into Grass -- perfectly legal, & what the Tera type defaulted to before this
    // was fixed alongside it -- silently kept Water Absorb instead of picking up Embody Aspect (Wellspring) & its
    // boost. the mask check went too: it can't be removed (Wellspring Mask's onTakeItem() returns false for Ogerpon)
    // & holding it `forcedForme`s the mon anyway, so the only thing it accomplished was breaking an opposing Ogerpon
    // whose item we hadn't seen revealed yet
    case 'Ogerpon': {
      if (terastallized) {
        return 'Ogerpon-Teal-Tera';
      }

      break;
    }

    case 'Ogerpon-Cornerstone': {
      if (terastallized) {
        return 'Ogerpon-Cornerstone-Tera';
      }

      break;
    }

    case 'Ogerpon-Cornerstone-Tera': {
      if (!terastallized) {
        return 'Ogerpon-Cornerstone';
      }

      break;
    }

    case 'Ogerpon-Hearthflame': {
      if (terastallized) {
        return 'Ogerpon-Hearthflame-Tera';
      }

      break;
    }

    case 'Ogerpon-Hearthflame-Tera': {
      if (!terastallized) {
        return 'Ogerpon-Hearthflame';
      }

      break;
    }

    case 'Ogerpon-Teal-Tera': {
      if (!terastallized) {
        return 'Ogerpon';
      }

      break;
    }

    case 'Ogerpon-Wellspring': {
      if (terastallized) {
        return 'Ogerpon-Wellspring-Tera';
      }

      break;
    }

    case 'Ogerpon-Wellspring-Tera': {
      if (!terastallized) {
        return 'Ogerpon-Wellspring';
      }

      break;
    }

    // note: base Terapagos -> Terastal is *Tera Shift* on switch-in, not Terastallization; only the Terastal forme
    // Tera's into Stellar (& like Ogerpon, the sim doesn't consult teraType to do it -- Terapagos is validated into
    // `requiredTeraType: 'Stellar'` regardless)
    case 'Terapagos': {
      return terastallized ? 'Terapagos-Stellar' : 'Terapagos-Terastal';
    }

    case 'Terapagos-Stellar': {
      if (!terastallized) {
        return 'Terapagos-Terastal';
      }

      break;
    }

    case 'Terapagos-Terastal': {
      if (terastallized) {
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
