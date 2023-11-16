import { type PkmnApiSmogonPreset } from './PkmnApiSmogonPreset';

/**
 * JSON response schema from the pkmn Format Sets API.
 *
 * @since 1.0.1
 */
export interface PkmnApiSmogonFormatPresetResponse {
  [speciesForme: string]: {
    [presetName: string]: PkmnApiSmogonPreset;
  };
}
