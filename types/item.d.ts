/**
 * item.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/battle-dex-data.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */

declare namespace Showdown {
  interface Item extends Effect {
    readonly effectType: 'Item';

    /**
     * @default 0
     */
    readonly num: number;

    /**
     * @default 0
     */
    readonly spritenum: number;

    /**
     * @default ''
     */
    readonly desc: string;

    /**
     * @default ''
     */
    readonly shortDesc: string;

    /**
     * @default ''
     */
    readonly megaStone: string;

    /**
     * @default ''
     */
    readonly megaEvolves: string;

    readonly zMove?: string | true;

    /**
     * @default ''
     */
    readonly zMoveType?: TypeName | '';
    readonly zMoveUser?: readonly string[];

    /**
     * @default ''
     */
    readonly onPlate?: TypeName;

    /**
     * @default ''
     */
    readonly onMemory?: TypeName;

    /**
     * @default ''
     */
    readonly onDrive?: TypeName;

    readonly fling?: unknown;
    readonly naturalGift?: unknown;
    readonly isPokeball: boolean;
    readonly itemUser?: readonly string[];

    (id: string, name: string, data: Partial<Item>): this;
  }
}
