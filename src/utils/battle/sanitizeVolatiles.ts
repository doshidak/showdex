import { type CalcdexPokemon } from '@showdex/redux/store';
import { formatId } from '@showdex/utils/core';

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
export const sanitizeVolatiles = (
  pokemon: DeepPartial<Showdown.Pokemon> | DeepPartial<CalcdexPokemon> = {},
): CalcdexPokemon['volatiles'] => Object.entries(pokemon?.volatiles || {})
  .reduce((sanitizedVolatiles, [id, volatile]) => {
    const [
      , // note: though unused, this is also equals the `id`
      value,
      ...rest
    ] = volatile || [];

    // we're gunna replace the Pokemon object w/ its ident if it's a transform volatile
    const transformed = formatId(id) === 'transform'
      && typeof (value as unknown as Showdown.Pokemon)?.ident === 'string';

    if (transformed || !value || ['string', 'number'].includes(typeof value)) {
      sanitizedVolatiles[id] = transformed ? [
        id,
        (value as unknown as Showdown.Pokemon).speciesForme,
        ...rest,
      ] : volatile;
    }

    return sanitizedVolatiles;
  }, {});
