import { type AbilityName, type ItemName, type MoveName } from '@smogon/calc';

/**
 * Schema of a Pokemon set from the pkmn API.
 *
 * @since 0.1.0
 */
export interface PkmnApiSmogonPreset {
  /**
   * Note that this key is purposefully all lowercase.
   *
   * @since 1.1.0
   */
  teratypes?: Showdown.TypeName | Showdown.TypeName[];

  /**
   * Note that this key exists in case the pkmn API changes the casing.
   *
   * @since 1.1.0
   */
  teraTypes?: Showdown.TypeName | Showdown.TypeName[];

  ability: AbilityName | AbilityName[];
  nature: Showdown.PokemonNature | Showdown.PokemonNature[];
  item: ItemName | ItemName[];
  moves: (MoveName | MoveName[])[];
  ivs?: Showdown.StatsTable | Showdown.StatsTable[];
  evs?: Showdown.StatsTable | Showdown.StatsTable[];
}
