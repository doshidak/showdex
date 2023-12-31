import {
  type AbilityName,
  type GenerationNum,
  type ItemName,
  type MoveName,
  type Terrain,
  type Weather,
} from '@smogon/calc';
import {
  PokemonDenormalizedMoves,
  PokemonMoveSkinAbilities,
  PokemonTypeAssociativeItems,
  TerrainPulseTypeConditions,
  WeatherBallTypeConditions,
} from '@showdex/consts/dex';
import { type CalcdexBattleField, type CalcdexPokemon } from '@showdex/interfaces/calc';
import { detectGenFromFormat } from './detectGenFromFormat';
import { detectGroundedness } from './detectGroundedness';
import { getDexForFormat } from './getDexForFormat';
import { getZMove } from './getZMove';

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
  config?: {
    format?: string | GenerationNum;
    field?: CalcdexBattleField;
  },
): Showdown.TypeName => {
  if (!pokemon?.speciesForme || !moveName) {
    return null;
  }

  const {
    format,
    field,
  } = config || {};

  const gen = detectGenFromFormat(format);
  const dex = getDexForFormat(format);
  const dexMove = dex?.moves.get(moveName);

  if (!dexMove?.exists) {
    return null;
  }

  const {
    name: dexMoveName,
    type: moveType,
    isZ,
  } = dexMove;

  const move = (dexMoveName as MoveName) || moveName;

  const {
    speciesForme,
    types,
    teraType: revealedTeraType,
    dirtyTeraType,
    terastallized,
    ability: revealedAbility,
    dirtyAbility,
    item: revealedItem,
    dirtyItem,
    useZ,
  } = pokemon;

  const teraType = dirtyTeraType || revealedTeraType;
  const ability = dirtyAbility || revealedAbility;
  const item = dirtyItem ?? revealedItem; // note: dirtyItem can be `''`, so using the nullish coalescing operator (`??`)

  // check Aerilate, Galvanize, Normalize, Pixilate & Refrigerate (possibly more idk check the const)
  if (Object.keys(PokemonMoveSkinAbilities).includes(ability)) {
    const hiddenPowerMove = move.startsWith('Hidden Power');
    const zMove = !!isZ || (useZ && !!getZMove(move, { item }));
    const shouldNormalize = ability === 'Normalize' as AbilityName
      && (gen < 5 || (!hiddenPowerMove && !zMove && !PokemonDenormalizedMoves.includes(move)));

    if (shouldNormalize || moveType === 'Normal') {
      return PokemonMoveSkinAbilities[ability];
    }
  }

  switch (move) {
    // primarily used by Morpeko
    case 'Aura Wheel': {
      // by default, Aura Wheel is Electric, so only change its type to Dark if it's Hangry
      if (speciesForme === 'Morpeko-Hangry') {
        return 'Dark';
      }

      break;
    }

    // the following can just be looked up by the item for their associated type in PokemonTypeAssociativeItems:
    // Judgment, primarily used by Arceus (via Plates)
    // Multi-Attack, primarily used by Silvally (via Memories)
    // Techno Blast, primarily used by Genesect (via Drives)
    case 'Judgment':
    case 'Multi-Attack':
    case 'Techno Blast': {
      // attempt to determine the type from the held item
      if (PokemonTypeAssociativeItems[item]) {
        return PokemonTypeAssociativeItems[item];
      }

      break;
    }

    // primarily used by Tauros-Paldea
    case 'Raging Bull': {
      // attempt to determine the type from the forme
      switch (speciesForme) {
        case 'Tauros-Paldea': // just in case, this was the forme before they renamed them all
        case 'Tauros-Paldea-Combat': {
          return 'Fighting';
        }

        case 'Tauros-Paldea-Fire': // pre-rename forme
        case 'Tauros-Paldea-Blaze': {
          return 'Fire';
        }

        case 'Tauros-Paldea-Water': // pre-rename forme
        case 'Tauros-Paldea-Aqua': {
          return 'Water';
        }

        default: {
          break;
        }
      }

      break;
    }

    // Ivy Cudgel, Ogerpon signature move
    case 'Ivy Cudgel': {
      // attempt to determine the type from the forme
      switch (speciesForme) {
        case 'Ogerpon': // Regular Ogerpon
        case 'Ogerpon-Teal-Tera': { // Regular Ogerpon tera
          return 'Grass';
        }

        case 'Ogerpon-Wellspring': // Ogerpon-Wellspring
        case 'Ogerpon-Wellspring-Tera': { // Ogerpon-Wellspring-tera
          return 'Water';
        }

        case 'Ogerpon-Hearthflame': // Ogerpon-Hearthflame
        case 'Ogerpon-Hearthflame-Tera': { // Ogerpon-Hearthflame-tera
          return 'Fire';
        }

        case 'Ogerpon-Cornerstone': // Ogerpon-Corenerstone
        case 'Ogerpon-Cornerstone-Tera': { // Ogerpon-Corenerstone-tera
          return 'Rock';
        }

        default: {
          break;
        }
      }

      break;
    }

    // primarily used by Oricorio
    case 'Revelation Dance': {
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
      switch (speciesForme) {
        case 'Oricorio': {
          return 'Fire';
        }

        case "Oricorio-Pa'u": {
          return 'Psychic';
        }

        case 'Oricorio-Pom-Pom': {
          return 'Electric';
        }

        case 'Oricorio-Sensu': {
          return 'Ghost';
        }

        default: {
          break;
        }
      }

      break;
    }

    // primarily used by every Pokemon, probably lol
    case 'Tera Blast': {
      // Tera Blast's type only becomes the `teraType` when `terastallized`
      if (teraType && terastallized) {
        return teraType;
      }

      break;
    }

    // Terapagos-Terastal's new move in Gen 9 DLC 2
    // (simply becomes Stellar type when in the Terapagos-Stellar forme, which is achieved by Terastallizing)
    case 'Tera Starstorm': {
      if (speciesForme === 'Terapagos-Stellar' && terastallized) {
        return 'Stellar';
      }

      break;
    }

    // gimmick being that it depends on the weather
    case 'Weather Ball': {
      // in gen 4, Normalize affects this move, so it should keep its default Normal type in that case
      if (!field?.weather || (gen < 5 && ability === 'Normalize' as AbilityName)) {
        break;
      }

      const shouldIgnoreWeather = item === 'Utility Umbrella' as ItemName && ([
        'Harsh Sunshine',
        'Heavy Rain',
        'Rain',
        'Sun',
      ] as Weather[]).includes(field.weather);

      if (shouldIgnoreWeather) {
        break;
      }

      // not taking into account stuff like Ion Deluge & Electrify atm
      const weatherType = (Object.entries(WeatherBallTypeConditions) as [Showdown.TypeName, Weather[]][])
        .find(([, conditions]) => conditions?.includes(field.weather))
        ?.[0];

      if (weatherType) {
        return weatherType;
      }

      break;
    }

    // gimmick that it's the same gimmick as Weather Ball, except it depends on the terrain
    case 'Terrain Pulse': {
      // luckily, this move didn't come into the game until gen 8, so we don't have to worry about the move skinners
      if (!field?.terrain || !detectGroundedness(pokemon, field)) {
        break;
      }

      const terrainType = (Object.entries(TerrainPulseTypeConditions) as [Showdown.TypeName, Terrain][])
        .find(([, condition]) => !!condition && condition === field.terrain)
        ?.[0];

      if (terrainType) {
        return terrainType;
      }

      break;
    }

    default: {
      break;
    }
  }

  return null;
};
