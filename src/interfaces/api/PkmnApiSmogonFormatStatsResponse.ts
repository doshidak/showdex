import { type PkmnApiSmogonStats } from './PkmnApiSmogonStats';

/**
 * JSON response schema from the pkmn Format Stats API.
 *
 * @since 1.0.3
 */
export interface PkmnApiSmogonFormatStatsResponse {
  battles: number;

  pokemon: {
    [speciesForme: string]: PkmnApiSmogonStats;
  };
}
