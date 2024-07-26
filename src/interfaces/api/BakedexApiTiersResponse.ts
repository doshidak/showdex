import { type ShowdexSupporterTier } from '@showdex/interfaces/app';
import { type BakedexApiResponse } from './BakedexApiResponse';

/**
 * JSON response schema from the Bakedex Supporter Tiers API.
 *
 * @since 1.2.4
 */
export type BakedexApiTiersResponse = BakedexApiResponse<'tiers', ShowdexSupporterTier[]>;
