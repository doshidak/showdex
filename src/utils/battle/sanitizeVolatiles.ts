import { type CalcdexPokemon } from '@showdex/interfaces/calc';
import { formatId } from '@showdex/utils/core';

/* eslint-disable @typescript-eslint/indent */

/**
 * Pokemon `volatiles` require special love & attention before they get Redux'd.
 *
 * * Ditto
 *   - ...and Mew, I guess
 * * hnnnnnnnnnnnnnnnnnnnnnnnng
 * * Separated from `sanitizePokemon()` cause I'm probably using it elsewhere.
 *
 * @since 0.1.3
 */
export const sanitizeVolatiles = <
  TPokemon extends Partial<Showdown.PokemonDetails>,
>(
  pokemon: TPokemon,
): CalcdexPokemon['volatiles'] => Object.entries(
  (pokemon as Partial<Showdown.Pokemon>)?.volatiles || {},
).reduce((
  volatiles,
  [id, volatile],
) => {
  const [
    , // note: though unused, this is also equals the `id`
    value,
    ...rest
  ] = volatile || [];

  // we're gunna replace the Pokemon object w/ its speciesForme if it's a transform volatile
  const transformed = formatId(id) === 'transform'
    && typeof (value as unknown as Showdown.Pokemon)?.speciesForme === 'string';

  if (transformed || !value || ['string', 'number'].includes(typeof value)) {
    volatiles[id] = transformed ? [
      id,
      (value as unknown as Showdown.Pokemon).speciesForme,
      ...rest,
    ] : volatile;
  }

  return volatiles;
}, {} as CalcdexPokemon['volatiles']);

/* eslint-enable @typescript-eslint/indent */
