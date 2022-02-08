/**
 * client-battle-choice.d.ts
 *
 * Provides `BattleItems` typings for the live PS client running on Backbone.js.
 *
 * @author Keith Choison <keith@tize.io>
 */

declare namespace Showdown {
  interface BattleItem {
    name: string;
    num: number;
    gen: number;
    desc: string;
    shortDesc?: number;
    spritenum: number;

    forcedForme?: string;
    megaStone?: string;
    megaEvolves?: string;
    zMove?: boolean;
    zMoveType?: TypeName;
    itemUser?: string[];
    isBerry?: boolean;
    isChoice?: boolean;
    isGem?: boolean;
    isPokeball?: boolean;
    isNonstandard: string;
    fling?: { basePower?: number; };
    naturalGift?: { basePower: number; type: TypeName; };
    boosts?: Record<StatNameNoHp, number>;
    ignoreKlutz?: boolean;

    onBoostPriority?: number;
    onBasePowerPriority?: number;
    onModifyAtkPriority?: number;
    onModifyDefPriority?: number;
    onModifySpAPriority?: number;
    onModifySpDPriority?: number;
    onModifySpePriority?: number;
    OnModifyAccuracyPriority?: number;
    onModifyMovePriority?: number;
    onFractionalPriorityPriority?: number;
    onAfterMoveSecondaryPriority?: number;
    onAfterMoveSecondarySelfPriority?: number;
    onTrapPokemonPriority?: number;
    onTryHealPriority?: number;
    onResidualOrder?: number;
    onResidualSubOrder?: number;
    onEat?: boolean;
    onTakeItem?: boolean;
    onDrive?: TypeName;
    onMemory?: TypeName;
    onPlate?: TypeName;
  }
}

declare const BattleItems: Record<string, Showdown.BattleItem>;
