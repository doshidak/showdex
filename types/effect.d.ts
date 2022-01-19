/**
 * effect.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/battle-dex-data.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */

declare namespace Showdown {
  type EffectType =
    | 'Item'
    | 'Move'
    | 'Ability'
    | 'Species'
    | 'PureEffect';

  interface Effect {
    readonly id: string;
    readonly name: string;
    readonly gen: number;
    readonly effectType: EffectType;

    /**
     * Do we have data on this item/move/ability/species?
     *
     * @warning Always `false` if the relevant data files aren't loaded.
     */
    readonly exists: boolean;
  }

  interface PureEffect extends Effect {
    effectType: 'PureEffect';

    (id: string, name: string): this;
  }

  interface Type extends Effect {
    damageTaken?: Record<string, unknown>;
    HPivs?: Partial<Showdown.StatsTable>;
    HPdvs?: Partial<Showdown.StatsTable>;
  }
}
