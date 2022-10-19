/**
 * `client-forfeit-popup.d.ts`
 *
 * Provides `ForfeitPopup` typings for the live PS client running on Backbone.js.
 *
 * @author Keith Choison <keith@tize.io>
 */

declare namespace Showdown {
  class ForfeitPopup extends ClientPopup {
    public type = 'semimodal';
    public gameType = 'battle';
    public room: BattleRoom;

    public constructor(data: {
      gameType: string;
      room: BattleRoom;
    });

    public replacePlayer(_data?: unknown): void;
    public submit(_data?: unknown): void;
  }
}
