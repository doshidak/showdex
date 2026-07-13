/**
 * @file `BootdexPreactBootstrappable.ts`
 * @author Keith Choison <keith@tize.io>
 * @since 1.3.0
 */

import { formatId } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { detectPreactHost } from '@showdex/utils/host';
import { BootdexBootstrappable } from './BootdexBootstrappable';
import { BootdexPreactAdapter } from './BootdexPreactAdapter';

const l = logger('@showdex/pages/Bootdex/BootdexPreactBootstrappable');

export abstract class BootdexPreactBootstrappable extends BootdexBootstrappable {
  public static override readonly scope = l.scope;
  public static override readonly Adapter = BootdexPreactAdapter;

  // note: the `onepanel` pref alone isn't enough -- PS also collapses to a single panel on its own when the
  // viewport's clientWidth is under 800px (& when there aren't both a left & right room to show), neither of
  // which touches the pref. PS.leftPanelWidth is the client's own single-panel flag & covers all three cases:
  // 0 when one panel is visible, null in the 'vertical' layout / under 800px, & a positive width otherwise --
  // i.e., falsy ==> single panel, which is exactly how PS.isVisiblePanel() reads it. it's recomputed by
  // PS.updateLayout() on init, on every PS.update() & on resize, so it's always current.
  public static override hasSinglePanel: typeof BootdexBootstrappable.hasSinglePanel = () => detectPreactHost(window) && (
    !window.PS.leftPanelWidth
  );

  public static override openUserPopup: typeof BootdexBootstrappable.openUserPopup = (username) => {
    if (!detectPreactHost(window)) {
      return;
    }

    const userId = formatId(username);

    if (!userId) {
      return;
    }

    window.PS.join(`user-${userId}` as Showdown.RoomID);
  };

  public static override openBattlesRoom: typeof BootdexBootstrappable.openBattlesRoom = () => {
    if (!detectPreactHost(window)) {
      return;
    }

    window.PS.join('battles' as Showdown.RoomID);
  };

  public static override acceptBattleOts: typeof BootdexBootstrappable.acceptBattleOts = (battleId) => {
    if (!detectPreactHost(window) || !battleId) {
      return;
    }

    window.PS.send('/acceptopenteamsheets', battleId as Showdown.RoomID);
  };

  public static detectMainMenuRoom(
    room: Showdown.PSRoom,
  ): room is Showdown.MainMenuRoom {
    return room?.classType === 'mainmenu';
  }

  public static detectBattleRoom(
    room: Showdown.PSRoom,
  ): room is Showdown.BattleRoom {
    return room?.classType === 'battle';
  }

  public static rewriteHistory( // hehe
    pathPrefix: string,
    destPath = '/',
  ): void {
    if (!detectPreactHost(window) || !window.location?.pathname?.startsWith(pathPrefix)) {
      return;
    }

    /* if (window.PS.leftPanel?.id && !this.detectMainMenuRoom(window.PS.leftPanel)) {
      return void window.PS.focusRoom(window.PS.leftPanel.id);
    } */

    window.history?.replaceState(window.PS.router?.panelState, '', destPath);
  }
}

// exported for convenience (technically available w/out the `window`, i.e., `new PSRoom()` is gucc),
// but these make TypeScript happy
export const PSRoom = detectPreactHost(window) ? window.PSRoom : null;
export const PSRoomPanel = detectPreactHost(window) ? window.PSRoomPanel : null;
export const PSPanelWrapper = detectPreactHost(window) ? window.PSPanelWrapper : null;
export const preact = detectPreactHost(window) ? window.preact : null;
