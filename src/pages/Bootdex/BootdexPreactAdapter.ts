/**
 * @file `BootdexPreactAdapter.ts`
 * @author Keith Choison <keith@tize.io>
 * @since 1.3.0
 */

import { determineFollowedCalcdexRoomId } from '@showdex/utils/app';
import { logger, wtf } from '@showdex/utils/debug';
import { detectPreactHost } from '@showdex/utils/host';
import { BootdexAdapter } from './BootdexAdapter';
import { BootdexManager } from './BootdexManager';
// import { BootdexPreactRouter } from './BootdexPreactRouter';

const l = logger('@showdex/pages/Bootdex/BootdexPreactAdapter');

export class BootdexPreactAdapter extends BootdexAdapter {
  public static override readonly scope = l.scope;

  protected static override hook = (): void => {
    if (!detectPreactHost(window)) {
      throw new Error('BootdexPreactAdapter can only be run in the Preact Showdown client!');
    }

    // this.hookRouter();
    this.hookUser();
    this.hookPrefs();
    this.hookRoomWidths();
    this.hookBattleTabFollow();
  };

  protected static override ready = (): void => {
    if (!detectPreactHost(window)) {
      throw new Error('BootdexPreactAdapter can only be run in the Preact Showdown client!');
    }
  };

  /* protected static hookRouter(): void {
    if (!detectPreactHost(window)) {
      return;
    }

    l.debug('Hard-swapping the Showdown.PSRouter for the BootdexPreactRouter...');
    window.PSRouter = BootdexPreactRouter;

    l.debug('Reinstantiating PS.router...');
    window.PS.router = new window.PSRouter();
  } */

  /**
   * Subscribes to `PS` so that switching battle tabs brings the matching Calcdex panel tab forward.
   *
   * * Only swaps when a visible panel is already showing a *different* battle's Calcdex (see
   *   `determineFollowedCalcdexRoomId()`), & respects the user's `followBattleTab` Calcdex setting.
   *
   * @since 1.4.2
   */
  protected static hookBattleTabFollow(): void {
    if (!detectPreactHost(window) || typeof window.PS.subscribe !== 'function') {
      return;
    }

    l.debug('Subscribing to PS for battle tab focus changes...');

    let prevRoomId = window.PS.room?.id;
    let following = false;

    window.PS.subscribe(() => {
      const roomId = window.PS.room?.id;

      // PS.update() fires for plenty besides focus changes, so only react when the focused room actually changes
      // (& PS.focusRoom() below re-enters this synchronously, so don't follow along w/ ourselves either)
      if (following || !roomId || roomId === prevRoomId) {
        return;
      }

      prevRoomId = roomId;

      const followedRoomId = determineFollowedCalcdexRoomId({
        enabled: BootdexPreactAdapter.rootState?.showdex?.settings?.calcdex?.followBattleTab ?? true,
        singlePanel: !window.PS.leftPanelWidth,
        focusedRoomId: roomId,
        panelRoomIds: [window.PS.leftPanel?.id, window.PS.rightPanel?.id],
        openRoomIds: Object.keys(window.PS.rooms || {}),
        // note: mirrors CalcdexPreactBootstrapper's roomId, which isn't imported here to avoid a circular import
        toCalcdexRoomId: (battleId) => `calcdex-${battleId}`,
        isCalcdexRoomId: (id) => !!id?.startsWith('calcdex-'),
      });

      if (!followedRoomId) {
        return;
      }

      following = true;

      try {
        window.PS.focusRoom(followedRoomId as Showdown.RoomID);
        window.PS.focusRoom(roomId);
      } finally {
        following = false;
        prevRoomId = window.PS.room?.id;
      }
    });
  }

  protected static hookUser(): void {
    if (!detectPreactHost(window)) {
      return;
    }

    l.debug('Subscribing to PS.user...');

    window.PS.user.subscribeAndRun(() => {
      const { user } = window.PS;

      if (!user?.named || !user.name) {
        BootdexPreactAdapter.authUsername = null;

        return;
      }

      l.debug(
        'PS.user.update()', 'Logged in as a', user.registered?.name ? 'registered' : 'guest',
        'user', user.registered?.name || user.name || '???', '(probably)',
        '\n', 'PS.user', user,
      );

      if (!user.name) {
        return;
      }

      // note: when a registered user is logged in, user.name === user.registered.name &
      // user.userid = user.registered.userid = formatId(user.registered.name)
      BootdexPreactAdapter.authUsername = user.name;
    });
  }

  protected static hookPrefs(): void {
    if (!detectPreactHost(window)) {
      return;
    }

    l.debug('Subscribing to PS.prefs...');

    window.PS.prefs.subscribeAndRun(() => {
      const { prefs } = window.PS;
      const { colorScheme: prevColorScheme } = BootdexPreactAdapter;

      if (!prefs?.theme || prevColorScheme === prefs.theme) {
        return;
      }

      l.debug(
        'PS.prefs.update()', 'Swapping colorScheme from', prevColorScheme, 'to', prefs.theme,
        '\n', 'PS.prefs', prefs,
      );

      BootdexPreactAdapter.colorScheme = prefs.theme;
    });
  }

  // unfortunately we can't extend window.PS since it's an instantiated inline class, e.g., PS = new class extends PSModel { ... },
  // so ... hello darkness my old friend
  protected static hookRoomWidths(): void {
    if (!detectPreactHost(window)) {
      return;
    }

    l.debug('Overriding PS.getWidthFor()...');

    if (typeof window.PS.getWidthFor !== 'function') {
      if (__DEV__) {
        l.warn(
          'PS.getWidthFor() isn\'t a function!',
          'while Showdex will work, the left-right panel behavior may misbehave for Showdex\'s custom rooms :c',
          '\n', 'PS.getWidthFor()', '(typeof)', wtf(window.PS.getWidthFor), // eslint-disable-line @typescript-eslint/unbound-method
          '\n', '(you\'ll only see this warning in __DEV__)',
        );
      }

      return;
    }

    const getWidthFor = window.PS.getWidthFor.bind(window.PS) as Showdown.PS['getWidthFor'];

    window.PS.getWidthFor = (room) => {
      if (BootdexManager.registered(room?.type as UnwrapArray<typeof BootdexManager.registry>)) {
        return {
          minWidth: 320,
          width: 628,
          maxWidth: 628,
        };
      }

      return getWidthFor(room);
    };
  }
}
