/**
 * ability.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/battle-dex-data.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */

declare namespace Showdown {
  interface Ability extends Effect {
    readonly effectType: 'Ability';

    readonly num: number;
    readonly desc: string;
    readonly shortDesc: string;

    readonly rating: number;
    readonly isPermanent: boolean;
    readonly isNonstandard: boolean;

    (id: string, name: string, data: Partial<Ability>): this;
  }
}
