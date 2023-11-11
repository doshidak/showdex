import { type AbilityName, type ItemName, type MoveName } from '@smogon/calc';

/**
 * Schema of a Pokemon's set probabilities from the pkmn API.
 *
 * * Note that this is for a **single** Pokemon.
 * * Prior to v1.1.8, this was defined directly in `PkmnApiSmogonRandomsStatsResponse`.
 *
 * @since 1.1.8
 */
export interface PkmnApiSmogonRandomsStats {
  level: number;
  abilities: { [name: AbilityName]: number; };
  items: { [name: ItemName]: number; };
  moves?: { [name: MoveName]: number; };
  ivs?: Showdown.StatsTable;
  evs?: Showdown.StatsTable;
  roles?: {
    [roleName: string]: {
      weight: number;
      abilities?: { [name: AbilityName]: number; };
      items?: { [name: ItemName]: number; };
      teraTypes: Record<Showdown.TypeName, number>;
      moves: { [name: MoveName]: number; };
    };
  };
}
