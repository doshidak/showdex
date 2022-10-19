/**
 * `battle-panel.d.ts`
 *
 * Adapted from `pokemon-showdown-client/src/panel-battle.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license AGPLv3
 */

declare namespace Showdown {
  class BattlePanel extends ChatRoom {
    public override readonly classType: 'battle';

    public pmTarget: null;
    public challengeMenuOpen: false;
    public challengingFormat: null;
    public challengedFormat: null;

    public battle?: Battle;

    /**
     * * `null` if spectator.
     * * Otherwise, current player's info.
     */
    public side?: BattleRequestSideInfo;
    public request?: BattleRequest;
    public choices?: BattleChoiceBuilder;
  }
}
