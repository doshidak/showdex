/**
 * side.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/battle.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */

declare namespace Showdown {
  /**
   * Adapted from `addSideCondition()` in `js/battle.js` (line 667) of `smogon/pokemon-showdown-client`.
   */
  type SideConditionName =
    | 'auroraveil'
    | 'firepledge'
    | 'gmaxcannonade'
    | 'gmaxsteelsurge'
    | 'gmaxvinelash'
    | 'gmaxvolcalith'
    | 'gmaxwildfire'
    | 'grasspledge'
    | 'lightscreen'
    | 'luckychant'
    | 'mist'
    | 'reflect'
    | 'safeguard'
    | 'spikes'
    | 'stealthrock'
    | 'stickyweb'
    | 'tailwind'
    | 'toxicspikes'
    | 'waterpledge';

  interface Side {
    battle: Battle;

    /**
     * @default ''
     */
    name: string;

    /**
     * @default ''
     */
    id: string;

    sideid: SideID;
    n: number;
    isFar: boolean;
    foe?: Side;
    ally?: Side;

    /**
     * @default 'unknown'
     */
    avatar: string;

    /**
     * @default ''
     */
    rating: string;

    /**
     * @default 6
     */
    totalPokemon: number;

    /**
     * @default 0
     */
    x: number;

    /**
     * @default 0
     */
    y: number;

    /**
     * @default 0
     */
    z: number;

    missedPokemon?: Pokemon;
    wisher?: Pokemon;

    /**
     * @default [null]
     */
    active: Pokemon[];

    lastPokemon?: Pokemon;

    /**
     * @default []
     */
    pokemon: Pokemon[];

    /**
     * `[effectName, levels, minDuration, maxDuration]`
     */
    sideConditions: {
      [name?: SideConditionName | string]: [
        effectName: string,
        levels: number,
        minDuration: number,
        maxDuration: number,
      ];
    };

    /**
     * Whether we overwrote the `addPokemon()` method.
     *
     * @since 1.0.3
     */
    calcdexProcessed?: boolean;

    (battle: Battle, n: number): this;

    destroy(): void;
    reset(): void;

    behindx(offset: number): number;
    behindy(offset: number): number;
    leftof(offset: number): number;
    behind(offset: number): number;

    rollTrainerSprites(): void;
    clearPokemon(): void;

    setAvatar(avatar: string): void;
    setName(name: string, avatar?: string): void;

    addSideCondition(effect: Effect): void;
    removeSideCondition(condition: string): void;

    addPokemon(name: string, ident: string, details: string, replaceSlot?: number): Pokemon;
    switchIn(pokemon: Pokemon, slot?: number): void;
    dragIn(pokemon: Pokemon, slot?: number): void;
    replace(pokemon: Pokemon, slot?: number): void;
    switchOut(pokemon: Pokemon, slot?: number): void;
    swapTo<T extends Record<string, unknown>>(pokemon: Pokemon, slot: number, kwArgs?: T): void;
    swapWith<T extends Record<string, unknown>>(pokemon: Pokemon, target: Pokemon, kwArgs?: T): void;
    faint(pokemon: Pokemon, slot?: number): void;
  }
}
