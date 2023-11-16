import { type PkmnApiSmogonPreset } from './PkmnApiSmogonPreset';

/**
 * JSON response schema from the pkmn Gen Sets API.
 *
 * * Models the structure of the sets of an entire gen (e.g., `'/gen8.json'`),
 *   which includes every format in that gen.
 *   - Incompatible with the structure of the sets of a single format (e.g., `'/gen8ou.json'`),
 *     which does not have the `format` key wrapping each `PkmnApiSmogonPreset`.
 * * Note that the Randoms API has a different schema, so you should use `PkmnApiSmogonRandomsPresetResponse` instead.
 * * Won't be used as a final type since we'll convert these into `CalcdexPokemonPreset`s
 *   in the `transformPresetResponse()` function.
 * * Updated from v0.1.0, where the original typing was something like:
 *   `Record<string, Record<string, Record<string, unknown>>>`.
 *   - Required lots of manual type assertions, so this is a lot cleaner.
 *   - No idea why I didn't type it like this in the first place... LOL.
 *
 * @since 0.1.3
 */
export interface PkmnApiSmogonPresetResponse {
  [speciesForme: string]: {
    [format: string]: {
      [presetName: string]: PkmnApiSmogonPreset;
    }
  }
}
