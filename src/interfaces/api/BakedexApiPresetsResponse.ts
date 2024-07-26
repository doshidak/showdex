import { type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
import { type BakedexApiResponse } from './BakedexApiResponse';

/**
 * JSON response schema from the Bakedex Presets API.
 *
 * @since 1.2.4
 */
export type BakedexApiPresetsResponse = BakedexApiResponse<'presets', Record<string, CalcdexPokemonPreset>>;
