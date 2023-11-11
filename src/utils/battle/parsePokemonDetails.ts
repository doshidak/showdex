import { type CalcdexPokemon } from '@showdex/interfaces/calc';

/**
 * Deconstructs a `details` string into a nice `CalcdexPokemon` partial.
 *
 * * If the deconstruction fails for whatever reason, `null` will be returned.
 *
 * @example
 * ```ts
 * parsePokemonDetails('Zoroark, L69, M');
 *
 * {
 *   speciesForme: 'Zoroark',
 *   level: 69,
 *   gender: 'M',
 * } as Partial<CalcdexPokemon>
 * ```
 * @since 1.1.7
 */
export const parsePokemonDetails = (
  details: string,
  delimiter = ', ',
): Partial<CalcdexPokemon> => {
  if (!details) {
    return null;
  }

  const [
    speciesForme,
    ...rest
  ] = details.split(delimiter);

  if (!speciesForme) {
    return null;
  }

  const output: Partial<CalcdexPokemon> = {
    speciesForme,
  };

  rest.forEach((detail) => {
    if (/^L\d+$/.test(detail)) {
      output.level = parseInt(detail.slice(1), 10) || 0;

      if (!output.level) {
        delete output.level;
      }

      return;
    }

    if (/^(M|F)$/.test(detail)) {
      output.gender = detail as Showdown.GenderName;
    }
  });

  return output;
};
