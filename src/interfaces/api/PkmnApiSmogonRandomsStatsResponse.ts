import { type PkmnApiSmogonRandomsStats } from './PkmnApiSmogonRandomsStats';

/**
 * JSON response schema from the pkmn Randoms Stats API.
 *
 * @since 1.0.7
 */
export interface PkmnApiSmogonRandomsStatsResponse {
  [speciesForme: string]: PkmnApiSmogonRandomsStats;
}
