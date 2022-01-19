/**
 * battle-room.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/panel-battle.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license AGPLv3
 */

declare namespace Showdown {
  interface BattleRoom extends ChatRoom {
    override readonly classType: 'battle';

    pmTarget: null;
    challengeMenuOpen: false;
    challengingFormat: null;
    challengedFormat: null;

    battle?: Battle;

    /**
     * * `null` if spectator.
     * * Otherwise, current player's info.
     */
    side?: BattleRequestSideInfo;
    request?: BattleRequest;
    choices?: BattleChoiceBuilder;
  }
}
