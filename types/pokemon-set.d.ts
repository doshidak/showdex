/**
 * pokemon-set.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/battle-tooltips.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */

declare namespace Showdown {
  /**
   * This can be sparse, in which case that entry should be inferred from the rest of the set,
   * according to sensible defaults.
   */
  interface PokemonSet {
    /**
     * Defaults to the species name (not including `forme`), like in the games.
     */
    name?: string;

    species?: string;

    /**
     * Defaults to no item.
     */
    item?: string;

    /**
     * Defaults to no ability (error in Gen 3+).
     */
    ability?: string;

    moves?: string[];

    /**
     * Defaults to no nature (error in Gen 3+).
     */
    nature?: NatureName;

    /**
     * Defaults to random legal gender, NOT subject to gender ratios.
     */
    gender?: string;

    /** Defaults to flat `252`s (`200`s/`0`s in Let's Go) (error in Gen 3+). */
    evs?: Partial<StatsTable>;

    /** Defaults to whatever makes sense - flat `31`s unless you have Gyro Ball, etc. */
    ivs?: Partial<StatsTable>;

    /** Defaults as you'd expect (`100` normally, `50` in VGC-likes, `5` in LC). */
    level?: number;

    /** Defaults to `false` (error if shiny event). */
    shiny?: boolean;

    /** Defaults to `255` unless you have *Frustration*, in which case, `0`. */
    happiness?: number;

    /** Defaults to event-required ball, otherwise, Poke Ball. */
    pokeball?: string;

    /** Defaults to the type of your *Hidden Power* in `Moves`, otherwise, *Dark*. */
    hpType?: string;

    /** Defaults to `false` (can only be `true` for certain Pokemon). */
    gigantamax?: boolean;
  }
}
