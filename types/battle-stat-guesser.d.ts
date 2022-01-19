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
  interface BattleStatGuesser {
    formatid: string;
    dex: ModdedDex;
    moveCount?: { [K in PokemonSet]: number; };
    hasMove?: { [moveid: string]: number; };
    ignoreEVLimits?: boolean;
    supportsEVs?: boolean;
    supportsAVs?: boolean;

    (formatid: string): this;

    guess(set: PokemonSet): {
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
    guessRole(set: PokemonSet): string;

    ensureMinEVs(evs: StatsTable, stat: StatName, min: number, evTotal: number): number;
    ensureMaxEVs(evs: StatsTable, stat: StatName, min: number, evTotal: number): number;
    guessEVs(set: PokemonSet, role: PokemonRole): Partial<StatsTable> & { plusStat?: StatName | ''; minusStat?: StatName | ''; };
    getStat(stat: StatName, set: PokemonSet, evOverride?: number, natureOverride?: number): number;
  }
}
