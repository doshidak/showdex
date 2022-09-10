import { logger } from '@showdex/utils/debug';
import type { AbilityName, MoveName } from '@pkmn/data';

const PokemonMaxMoveTypings: Record<Showdown.TypeName, MoveName> = {
  '???': null,
  Flying: <MoveName> 'Max Airstream',
  Dark: <MoveName> 'Max Darkness',
  Fire: <MoveName> 'Max Flare',
  Bug: <MoveName> 'Max Flutterby',
  Water: <MoveName> 'Max Geyser',
  Ice: <MoveName> 'Max Hailstorm',
  Fighting: <MoveName> 'Max Knuckle',
  Electric: <MoveName> 'Max Lightning',
  Psychic: <MoveName> 'Max Mindstorm',
  Poison: <MoveName> 'Max Ooze',
  Grass: <MoveName> 'Max Overgrowth',
  Ghost: <MoveName> 'Max Phantasm',
  Ground: <MoveName> 'Max Quake',
  Rock: <MoveName> 'Max Rockfall',
  Fairy: <MoveName> 'Max Starfall',
  Steel: <MoveName> 'Max Steelspike',
  Normal: <MoveName> 'Max Strike',
  Dragon: <MoveName> 'Max Wyrmwind',
};

const l = logger('@showdex/utils/app/getMaxMove');

/**
 * Returns the corresponding Max/G-Max move for a given move.
 *
 * * This requires the `'-Gmax'` suffix in the passed-in `speciesForme` to distinguish between Max and G-Max moves!
 *   - e.g., `'Alcremie-Gmax'` should be passed in for the `speciesForme` argument, not just `'Alcremie'`.
 * * As of v1.0.1, we're opting to use the global `Dex` object as opposed to the `dex` from `@pkmn/dex`
 *   since we still get back information even if we're not in the correct gen (especially in National Dex formats).
 *
 * @see https://github.com/smogon/damage-calc/blob/bdf9e8c39fec7670ed0ce64e1fb58d1a4dc83b73/calc/src/move.ts#L242
 * @since 0.1.2
 */
export const getMaxMove = (
  // dex: Generation,
  moveName: MoveName,
  abilityName?: AbilityName,
  speciesForme?: string,
): MoveName => {
  // if (typeof dex?.moves?.get !== 'function') {
  if (typeof Dex === 'undefined') {
    if (__DEV__) {
      l.warn(
        'Global Dex object is unavailable.',
        // 'passed-in dex object is invalid cause dex.moves.get() is not a function',
        // '\n', 'typeof dex.moves.get', typeof dex?.moves?.get,
        '\n', 'moveName', moveName,
        '\n', 'abilityName', abilityName,
        '\n', 'speciesForme', speciesForme,
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
        '\n', 'abilityName', abilityName,
        '\n', 'speciesForme', speciesForme,
        '\n', '(You will only see this warning on development.)',
      );
    }

    return null;
  }

  if (move.category === 'Status') {
    return <MoveName> 'Max Guard';
  }

  const ability = abilityName ? Dex.abilities.get(abilityName) : null;

  if (ability?.name === 'Normalize') {
    return PokemonMaxMoveTypings.Normal;
  }

  switch (move.type) {
    case 'Dark': {
      switch (speciesForme) {
        case 'Grimmsnarl-Gmax': {
          return <MoveName> 'G-Max Snooze';
        }

        case 'Urshifu-Gmax': {
          return <MoveName> 'G-Max One Blow';
        }

        default: {
          break;
        }
      }

      break;
    }

    case 'Dragon': {
      if (speciesForme === 'Duraludon-Gmax') {
        return <MoveName> 'G-Max Depletion';
      }

      break;
    }

    case 'Electric': {
      if (speciesForme === 'Pikachu-Gmax') {
        return <MoveName> 'G-Max Volt Crash';
      }

      if (speciesForme?.startsWith('Toxtricity') && speciesForme?.endsWith('Gmax')) {
        return <MoveName> 'G-Max Stun Shock';
      }

      break;
    }

    case 'Fairy': {
      switch (speciesForme) {
        case 'Alcremie-Gmax': {
          return <MoveName> 'G-Max Finale';
        }

        case 'Hatterene-Gmax': {
          return <MoveName> 'G-Max Smite';
        }

        default: {
          break;
        }
      }

      break;
    }

    case 'Fighting': {
      if (speciesForme === 'Machamp-Gmax') {
        return <MoveName> 'G-Max Chi Strike';
      }

      break;
    }

    case 'Fire': {
      switch (speciesForme) {
        case 'Centiskorch-Gmax': {
          return <MoveName> 'G-Max Centiferno';
        }

        case 'Charizard-Gmax': {
          return <MoveName> 'G-Max Wildfire';
        }

        case 'Cinderace-Gmax': {
          return <MoveName> 'G-Max Fire Ball';
        }

        default: {
          break;
        }
      }

      break;
    }

    case 'Flying': {
      if (speciesForme === 'Corviknight-Gmax') {
        return <MoveName> 'G-Max Wind Rage';
      }

      break;
    }

    case 'Ghost': {
      if (speciesForme === 'Gengar-Gmax') {
        return <MoveName> 'G-Max Terror';
      }

      break;
    }

    case 'Grass': {
      switch (speciesForme) {
        case 'Appletun-Gmax': {
          return <MoveName> 'G-Max Sweetness';
        }

        case 'Flapple-Gmax': {
          return <MoveName> 'G-Max Tartness';
        }

        case 'Rillaboom-Gmax': {
          return <MoveName> 'G-Max Drum Solo';
        }

        case 'Venusaur-Gmax': {
          return <MoveName> 'G-Max Vine Lash';
        }

        default: {
          break;
        }
      }

      break;
    }

    case 'Ground': {
      if (speciesForme === 'Sandaconda-Gmax') {
        return <MoveName> 'G-Max Sandblast';
      }

      break;
    }

    case 'Ice': {
      if (speciesForme === 'Lapras-Gmax') {
        return <MoveName> 'G-Max Resonance';
      }

      break;
    }

    case 'Normal': {
      switch (speciesForme) {
        case 'Eevee-Gmax': {
          return <MoveName> 'G-Max Cuddle';
        }

        case 'Meowth-Gmax': {
          return <MoveName> 'G-Max Gold Rush';
        }

        case 'Snorlax-Gmax': {
          return <MoveName> 'G-Max Replenish';
        }

        default: {
          break;
        }
      }

      switch (ability?.name) {
        case 'Aerilate': {
          return PokemonMaxMoveTypings.Flying;
        }

        case 'Galvanize': {
          return PokemonMaxMoveTypings.Electric;
        }

        case 'Pixilate': {
          return PokemonMaxMoveTypings.Fairy;
        }

        case 'Refrigerate': {
          return PokemonMaxMoveTypings.Ice;
        }

        default: {
          break;
        }
      }

      break;
    }

    case 'Poison': {
      if (speciesForme === 'Garbodor-Gmax') {
        return <MoveName> 'G-Max Malodor';
      }

      break;
    }

    case 'Psychic': {
      if (speciesForme === 'Orbeetle-Gmax') {
        return <MoveName> 'G-Max Gravitas';
      }

      break;
    }

    case 'Rock': {
      if (speciesForme === 'Coalossal-Gmax') {
        return <MoveName> 'G-Max Volcalith';
      }

      break;
    }

    case 'Steel': {
      switch (speciesForme) {
        case 'Copperajah-Gmax': {
          return <MoveName> 'G-Max Steelsurge';
        }

        case 'Melmetal-Gmax': {
          return <MoveName> 'G-Max Meltdown';
        }

        default: {
          break;
        }
      }

      break;
    }

    case 'Water': {
      switch (speciesForme) {
        case 'Blastoise-Gmax': {
          return <MoveName> 'G-Max Cannonade';
        }

        case 'Drednaw-Gmax': {
          return <MoveName> 'G-Max Stonesurge';
        }

        case 'Inteleon-Gmax': {
          return <MoveName> 'G-Max Hydrosnipe';
        }

        case 'Kingler-Gmax': {
          return <MoveName> 'G-Max Foam Burst';
        }

        case 'Urshifu-Rapid-Strike-Gmax': {
          return <MoveName> 'G-Max Rapid Flow';
        }

        default: {
          break;
        }
      }

      break;
    }

    default: {
      break;
    }
  }

  return PokemonMaxMoveTypings[move.type];
};
