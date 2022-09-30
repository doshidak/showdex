import { formatId } from '@showdex/utils/app';
import type { CalcdexPokemon } from '@showdex/redux/store';

/**
 * Pokemon `volatiles` require special love and attention before they get Redux'd.
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
      && typeof (<Showdown.Pokemon> <unknown> value)?.ident === 'string';

    if (transformed || !value || ['string', 'number'].includes(typeof value)) {
      sanitizedVolatiles[id] = transformed ? [
        id,
        (<Showdown.Pokemon> <unknown> value).speciesForme,
        ...rest,
      ] : volatile;
    }

    return sanitizedVolatiles;
  }, {});
