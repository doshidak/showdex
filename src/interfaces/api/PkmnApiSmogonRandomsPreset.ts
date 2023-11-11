import { type AbilityName, type ItemName, type MoveName } from '@smogon/calc';

/**
 * Schema of a Pokemon set for Randoms formats from the pkmn API.
 *
 * * Note that in Randoms, all Pokemon are given the neutral *Hardy* nature.
 *   - There are 4 other neutral natures like *Bashful* and *Serious*, but looking at the `@smogon/damage-calc`
 *     (aka. ex-`@honko/damage-calc`) code, it seems the choice was *Hardy*.
 *
 * @see https://calc.pokemonshowdown.com/randoms.html
 * @since 0.1.0
 */
export interface PkmnApiSmogonRandomsPreset {
  level: number;
  abilities: AbilityName[];
  items: ItemName[];

  /**
   * Won't exist in Gen 9 due to the introduction of the `roles` system.
   *
   * @since 0.1.0
   */
  moves?: MoveName[];

  /**
   * Unless specified, all IVs should default to `31`.
   *
   * @example
   * ```ts
   * // results in IVs: 31 HP, 0 ATK, 31 DEF, 31 SPA, 31 SPD, 31 SPE
   * { atk: 0 }
   * ```
   * @since 0.1.0
   */
  ivs?: Showdown.StatsTable;

  /**
   * Unless specified, all EVs should default to `85`.
   *
   * * Why 85? Since you can only have total of 508 EVs, considering there are 6 different stats, we can apply a simple
   *   mathematical algorithm to arrive at the value 85 for each stat.
   *   - Technically, 508 ÷ 6 is 84.6667, but we ~~floor~~ ceil the value to 85 (because the `pokemon-showdown` server does so!).
   *   - Why 508? Because Pokemon said so. ¯\_(ツ)_/¯
   *   - Also for non-Chinese EVs, you typically apply 252 EVs to 2 stats and the remaining 4 EVs
   *     to another, so 252 + 252 + 4 = 508.
   *   - Showdown's Teambuilder also reports a max of 508 EVs.
   * * Update (2023/09/27): In the `pokemon-showdown` server source code, it's rounded to 85.
   *   - This results in a maximum possible overage of 2 EVs (85 * 6 = 510), but oh well.
   *
   * @example
   * ```ts
   * // results in EVs: 85 HP, 85 ATK, 85 DEF, 85 SPA, 85 SPD, 0 SPE
   * // (yes, this doesn't add up to 508 EVs, but that's how random sets work apparently)
   * { spe: 0 }
   * ```
   * @see https://calc.pokemonshowdown.com/randoms.html
   * @since 0.1.0
   */
  evs?: Showdown.StatsTable;

  /**
   * New roles system introduced for Gen 9 random battles.
   *
   * @since 1.1.0
   */
  roles?: {
    [roleName: string]: {
      abilities: AbilityName[];
      items: ItemName[];
      teraTypes: Showdown.TypeName[];
      moves: MoveName[];
      ivs?: Showdown.StatsTable;
      evs?: Showdown.StatsTable;
    };
  };
}
