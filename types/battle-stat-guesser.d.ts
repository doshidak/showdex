/**
 * battle-stat-guesser.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/battle-tooltips.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */

declare namespace Showdown {
  class BattleStatGuesser {
    public formatid: string;
    public dex: ModdedDex;
    public moveCount?: { [K in PokemonSet]: number; };
    public hasMove?: { [moveid: string]: number; };
    public ignoreEVLimits?: boolean;
    public supportsEVs?: boolean;
    public supportsAVs?: boolean;

    public constructor(formatid: string): this;

    public guess(set: PokemonSet): {
      role: PokemonRole;
      evs: StatsTable;
      plusStat: StatName;
      minusStat: StatName;
      moveCount: BattleStatGuesser['moveCount'];
      hasMove: BattleStatGuesser['hasMove'];
    };

    /**
     * @example 'Fast Physical Sweeper'
     * @example 'Special Biased Mixed Scarf'
     */
    public guessRole(set: PokemonSet): string;

    public ensureMinEVs(evs: StatsTable, stat: StatName, min: number, evTotal: number): number;
    public ensureMaxEVs(evs: StatsTable, stat: StatName, min: number, evTotal: number): number;
    public guessEVs(set: PokemonSet, role: PokemonRole): Partial<StatsTable> & { plusStat?: StatName | ''; minusStat?: StatName | ''; };
    public getStat(stat: StatName, set: PokemonSet, evOverride?: number, natureOverride?: number): number;
  }
}
