/**
 * move.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/battle-dex-data.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */

declare namespace Showdown {
  interface MoveFlags {
    /** The move has an animation when used on an ally. */
    allyanim?: 1 | 0;
    /** Power is multiplied by 1.5 when used by a Pokemon with the Strong Jaw Ability. */
    bite?: 1 | 0;
    /** Has no effect on Pokemon with the Bulletproof Ability. */
    bullet?: 1 | 0;
    /** Ignores a target's substitute. */
    bypasssub?: 1 | 0;
    /** The user is unable to make a move between turns. */
    charge?: 1 | 0;
    /** Makes contact. */
    contact?: 1 | 0;
    /** When used by a Pokemon, other Pokemon with the Dancer Ability can attempt to execute the same move. */
    dance?: 1 | 0;
    /** Thaws the user if executed successfully while the user is frozen. */
    defrost?: 1 | 0;
    /** Can target a Pokemon positioned anywhere in a Triple Battle. */
    distance?: 1 | 0;
    /** Prevented from being executed or selected during Gravity's effect. */
    gravity?: 1 | 0;
    /** Prevented from being executed or selected during Heal Block's effect. */
    heal?: 1 | 0;
    /** Can be copied by Mirror Move. */
    mirror?: 1 | 0;
    /** Prevented from being executed or selected in a Sky Battle. */
    nonsky?: 1 | 0;
    /** Has no effect on Grass-type Pokemon, Pokemon with the Overcoat Ability, and Pokemon holding Safety Goggles. */
    powder?: 1 | 0;
    /** Blocked by Detect, Protect, Spiky Shield, and if not a Status move, King's Shield. */
    protect?: 1 | 0;
    /** Power is multiplied by 1.5 when used by a Pokemon with the Mega Launcher Ability. */
    pulse?: 1 | 0;
    /** Power is multiplied by 1.2 when used by a Pokemon with the Iron Fist Ability. */
    punch?: 1 | 0;
    /** If this move is successful, the user must recharge on the following turn and cannot make a move. */
    recharge?: 1 | 0;
    /** Bounced back to the original user by Magic Coat or the Magic Bounce Ability. */
    reflectable?: 1 | 0;
    /** Can be stolen from the original user and instead used by another Pokemon using Snatch. */
    snatch?: 1 | 0;
    /** Has no effect on Pokemon with the Soundproof Ability. */
    sound?: 1 | 0;
  }

  type MoveTarget =
    // single-target
    | 'normal'
    | 'any'
    | 'adjacentAlly'
    | 'adjacentFoe'
    | 'adjacentAllyOrSelf'
    // single-target, automatic
    | 'self'
    | 'randomNormal'
    // spread
    | 'allAdjacent'
    | 'allAdjacentFoes'
    // side and field
    | 'allySide'
    | 'foeSide'
    | 'all';

  type MoveCategory =
    | 'Physical'
    | 'Special'
    | 'Status';

  interface Move extends Effect {
    readonly effectType: 'Move';

    readonly basePower: number;
    readonly accuracy: number | true;
    readonly pp: number;
    readonly type: TypeName;
    readonly category: MoveCategory;
    readonly priority: number;
    readonly target: MoveTarget;
    readonly pressureTarget: MoveTarget;
    readonly flag: Readonly<MoveFlags>;
    readonly critRatio: number;

    readonly desc: string;
    readonly shortDesc: string;

    readonly isNonstandard?: string;
    readonly isZ: string;
    readonly zMove?: {
      basePower?: number;
      effect?: string;
      boost?: { [stat in StatName]?: number; };
    };

    readonly isMax: boolean | string;
    readonly maxMove: { basePower: number; };
    readonly ohko?: true | 'Ice';
    readonly recoil?: number[];
    readonly heal?: number[];
    readonly multihit?: number | number[];
    readonly hasCrashDamage: boolean;
    readonly noPPBoosts: boolean;
    readonly secondaries: ReadonlyArray<unknown>;
    readonly noSketch: boolean;
    readonly num: number;

    (id: string, name: string, data: Partial<Move>): this;
  }
}
