import { type ShowdexPlayerTitle } from '@showdex/interfaces/app';
import { type BakedexApiResponse } from './BakedexApiResponse';

/**
 * JSON response schema from the Bakedex Player Titles API.
 *
 * @since 1.2.4
 */
export type BakedexApiTitlesResponse = BakedexApiResponse<'titles', ShowdexPlayerTitle[]>;
