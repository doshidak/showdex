import { type PkmnApiSmogonRandomsPreset } from './PkmnApiSmogonRandomsPreset';

/**
 * JSON response schema from the pkmn Randoms API.
 *
 * * Note that the schema is different from that of the Gen Sets API,
 *   as outlined in the `PkmnApiSmogonPresetResponse` interface.
 * * Won't be used as a final type since we'll convert these into `CalcdexPokemonPreset`s
 *   in the `transformRandomsPresetResponse()` function.
 *   - Also note the slight difference in function's name, as it includes "Randoms".
 *   - Function without "Randoms" is for transforming the response from the Gen Sets API.
 *
 * @since 0.1.0
 */
export interface PkmnApiSmogonRandomsPresetResponse {
  [speciesForme: string]: PkmnApiSmogonRandomsPreset;
}
