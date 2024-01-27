import { type GenerationNum, type Weather } from '@smogon/calc';
import { type CalcdexPokemon } from '@showdex/interfaces/calc';
import { detectGenFromFormat } from './detectGenFromFormat';

/**
 * Determines what `Weather` the provided `pokemon` could invoke.
 *
 * * `null` is returned if determined to invoke nothing.
 * * `format` can be optionally provided to make the distinction between `'Hail'` in pre-gen 9 & `'Snow'`.
 *
 * @see https://github.com/smogon/damage-calc/blob/93d84dde21a0ec33a4ec280e896e810182d54cd5/src/js/shared_controls.js#L321-L368
 * @since 1.2.3
 */
export const determineWeather = (
  pokemon: CalcdexPokemon,
  format?: string | GenerationNum,
): Weather => {
  if (!pokemon?.speciesForme) {
    return null;
  }

  const gen = detectGenFromFormat(format);

  const {
    ability: revealedAbility,
    dirtyAbility,
  } = pokemon;

  const ability = dirtyAbility || revealedAbility;

  switch (ability) {
    case 'Delta Stream': {
      return 'Strong Winds';
    }

    case 'Desolate Land': {
      return 'Harsh Sunshine';
    }

    case 'Drizzle': {
      return 'Rain';
    }

    case 'Drought':
    case 'Orichalcum Pulse': {
      return 'Sun';
    }

    case 'Primordial Sea': {
      return 'Heavy Rain';
    }

    case 'Sand Stream': {
      return 'Sand';
    }

    case 'Snow Warning': {
      return (gen || 0) < 9 ? 'Hail' : 'Snow';
    }

    default: {
      break;
    }
  }

  return null;
};
