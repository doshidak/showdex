import { type BakedexApiPresetsResponse } from './BakedexApiPresetsResponse';
import { type BakedexApiTiersResponse } from './BakedexApiTiersResponse';
import { type BakedexApiTitlesResponse } from './BakedexApiTitlesResponse';
import { type BakedexApiResponse, type BakedexApiResponseEntity } from './BakedexApiResponse';

/* eslint-disable @typescript-eslint/indent */

/**
 * JSON response schema from the Bakedex Bundle API.
 *
 * * This is the good stuff.
 *
 * @since 1.2.4
 */
export type BakedexApiBundleResponse<
  TEntity extends Omit<BakedexApiResponseEntity, 'buns'> = Omit<BakedexApiResponseEntity, 'buns'>,
> = BakedexApiResponse<
  TEntity,
  TEntity extends 'presets'
    ? BakedexApiPresetsResponse['payload']
    : TEntity extends 'titles'
      ? BakedexApiTitlesResponse['payload']
      : BakedexApiTiersResponse['payload']
>;

/* eslint-enable @typescript-eslint/indent */
