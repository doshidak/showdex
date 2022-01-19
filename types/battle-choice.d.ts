/**
 * battle-choice.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/battle-choices.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */

declare namespace Showdown {
  interface BattleMoveChoice {
    choiceType: 'move';

    /**
     * 1-based move.
     */
    move: number;
    targetLoc: number;
    mega: boolean;
    ultra: boolean;
    max: boolean;
    z: boolean;
  }

  interface BattleShiftChoice {
    choiceType: 'shift';
  }

  interface BattleSwitchChoice {
    choiceType: 'switch' | 'team';

    /**
     * 1-based Pokemon.
     */
    targetPokemon: number;
  }

  type BattleChoice =
    | BattleMoveChoice
    | BattleShiftChoice
    | BattleSwitchChoice;
}
