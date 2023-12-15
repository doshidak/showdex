import { type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
import { type HydroHeader } from './HydroHeader';

/**
 * Hydrated payload from dehydrated presets.
 *
 * @since 1.1.6
 */
export interface HydroPresets extends HydroHeader {
  /**
   * Hydrated presets.
   *
   * @since 1.1.6
   */
  presets?: CalcdexPokemonPreset[];
}
