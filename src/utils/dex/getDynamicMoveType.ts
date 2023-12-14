import { type MoveName } from '@smogon/calc';
import { PokemonTypeAssociativeItems } from '@showdex/consts/dex';
import { type CalcdexPokemon } from '@showdex/interfaces/calc';
import { formatId } from '@showdex/utils/core';

/**
 * Determines the dynamic type of the provided `moveName`.
 *
 * * Dynamic types exist for moves whose type depends on other factors, like the `speciesForme` of the `pokemon`.
 * * `null` will be returned if the `moveName` doesn't have a dynamic type or one couldn't be determined.
 *   - In this case, you should fallback to using the `type` provided by the dex lookup via `dex.moves.get()`.
 *
 * @since 1.1.6
 */
export const getDynamicMoveType = (
  pokemon: CalcdexPokemon,
  moveName: MoveName,
): Showdown.TypeName => {
  if (!pokemon?.speciesForme || !moveName) {
    return null;
  }

  const {
    speciesForme,
    types,
    teraType: revealedTeraType,
    dirtyTeraType,
    terastallized,
    item: revealedItem,
    dirtyItem,
  } = pokemon;

  const formeId = formatId(speciesForme);
  const teraType = dirtyTeraType || revealedTeraType;
  const item = dirtyItem ?? revealedItem; // note: dirtyItem can be `''`, so using the nullish coalescing operator (`??`)
  const moveId = formatId(moveName);

  switch (moveId) {
    // Aura Wheel, primarily used by Morpeko
    case 'aurawheel': {
      // by default, Aura Wheel is Electric, so only change its type to Dark if it's Hangry
      if (formeId === 'morpekohangry') {
        return 'Dark';
      }

      break;
    }

    // the following can just be looked up by the item for their associated type in PokemonTypeAssociativeItems:
    // Judgment, primarily used by Arceus (via Plates)
    // Multi-Attack, primarily used by Silvally (via Memories)
    // Techno Blast, primarily used by Genesect (via Drives)
    case 'judgment':
    case 'multiattack':
    case 'technoblast': {
      // attempt to determine the type from the held item
      if (item && item in PokemonTypeAssociativeItems) {
        return PokemonTypeAssociativeItems[item];
      }

      break;
    }

    // Raging Bull, primarily used by Tauros-Paldea
    case 'ragingbull': {
      // attempt to determine the type from the forme
      switch (formeId) {
        case 'taurospaldea': // Tauros-Paldea (just in case, this was the forme before they renamed them all)
        case 'taurospaldeacombat': { // Tauros-Paldea-Combat
          return 'Fighting';
        }

        case 'taurospaldeafire': // Tauros-Paldea-Fire (pre-rename forme)
        case 'taurospaldeablaze': { // Tauros-Paldea-Blaze
          return 'Fire';
        }

        case 'taurospaldeawater': // Tauros-Paldea-Water (pre-rename forme)
        case 'taurospaldeaaqua': { // Tauros-Paldea-Aqua
          return 'Water';
        }

        default: {
          break;
        }
      }

      break;
    }

    // Ivy Cudgel, Ogerpon signature move
    case 'ivycudgel': {
      // attempt to determine the type from the forme
      switch (formeId) {
        case 'ogerpon': // Regular Ogerpon
        case 'ogerpontealtera': { // Regular Ogerpon tera
          return 'Grass';
        }
        case 'ogerponwellspring': // Ogerpon-Wellspring
        case 'ogerponwellspringtera': { // Ogerpon-Wellspring-tera
          return 'Water';
        }
        case 'ogerponhearthflame': // Ogerpon-Hearthflame
        case 'ogerponhearthflametera': { // Ogerpon-Hearthflame-tera
          return 'Fire';
        }
        case 'ogerponcornerstone': // Ogerpon-Corenerstone
        case 'ogerponcornerstonetera': { // Ogerpon-Corenerstone-tera
          return 'Rock';
        }

        default: {
          break;
        }
      }

      break;
    }

    // Revelation Dance, primarily used by Oricorio
    case 'revelationdance': {
      // if the Pokemon is Terastallized, the move's type is the Pokemon's Tera type
      if (teraType && terastallized) {
        return teraType;
      }

      // this move is Typeless if the Pokemon itself doesn't have a type
      // (resorting to '???' if the Pokemon legit has an empty types[] array)
      if (!types?.length) {
        return '???';
      }

      // if its primary type isn't typeless, use it
      // (typically, the different Oricorio formes specify their unique typings as the primary, Flying as the secondary)
      if (types[0] !== '???') {
        return types[0];
      }

      // if it's primary type is typeless, use the secondary type (even if Typeless), if any
      if (types[0] === '???' && types[1]) {
        return types[1];
      }

      // attempt to determine the type from the forme
      // (note: since Hackmons are a thing, we shouldn't assume the user of this move is an Oricorio!)
      switch (formeId) {
        case 'oricorio': {
          return 'Fire';
        }

        case 'oricoriopau': { // Oricorio-Pa'u
          return 'Psychic';
        }

        case 'oricoriopompom': { // Oricorio-Pom-Pom
          return 'Electric';
        }

        case 'oricoriosensu': { // Oricorio-Sensu
          return 'Ghost';
        }

        default: {
          break;
        }
      }

      break;
    }

    // Tera Blast, primarily used by every Pokemon, probably lol
    case 'terablast': {
      // Tera Blast's type only becomes the `teraType` when `terastallized`
      if (teraType && terastallized) {
        return teraType;
      }

      break;
    }

    default: {
      break;
    }
  }

  return null;
};
