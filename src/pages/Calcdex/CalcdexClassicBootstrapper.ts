/**
 * @file `CalcdexClassicBootstrapper.ts`
 * @author Keith Choison <keith@tize.io>
 * @since 1.3.0
 */

import * as ReactDOM from 'react-dom/client';
import { CalcdexPlayerKeys as AllPlayerKeys } from '@showdex/interfaces/calc';
import { calcdexSlice } from '@showdex/redux/store';
import { tRef } from '@showdex/utils/app';
import { detectAuthPlayerKeyFromBattle } from '@showdex/utils/battle';
import { formatId, nonEmptyObject } from '@showdex/utils/core';
import { logger, wtf } from '@showdex/utils/debug';
import { detectClassicHost } from '@showdex/utils/host';
import { BootdexClassicBootstrappable } from '../Bootdex/BootdexClassicBootstrappable';
import { MixinCalcdexBootstrappable } from './CalcdexBootstrappable';
import { CalcdexDomRenderer } from './CalcdexRenderer';
import styles from './Calcdex.module.scss';

/**
 * Object containing the function's `name` & its binded `native()` function.
 *
 * * Probably could've been typed better, but not trying to wrangle TypeScript rn lol.
 *
 * @since 1.0.3
 */
interface BattleRoomOverride<
  TFunc extends (...args: unknown[]) => unknown = (...args: unknown[]) => unknown,
> {
  name: FunctionPropertyNames<Showdown.ClientBattleRoom>;
  native: TFunc;
}

const l = logger('@showdex/pages/Calcdex/CalcdexClassicBootstrapper');

export class CalcdexClassicBootstrapper extends MixinCalcdexBootstrappable(BootdexClassicBootstrappable) {
  public static override readonly scope = l.scope;

  public static getCalcdexRoomId(
    this: void,
    battleId: string,
  ): `view-calcdex-${string}` {
    return `view-calcdex-${formatId(battleId)}`;
  }

  /**
   * Creates a `Showdown.ClientHtmlRoom` via the `BootdexClassicBootstrappable`'s `createHtmlRoom()` that's specially made
   * to house a `Calcdex`.
   *
   * * Essentially exists to keep all the properties like the room name & icon consistent.
   * * ~~Provide the optional Redux `store` argument to supply the room's `requestLeave()` handler,
   *   which will update the corresponding `Showdown.ClientBattleRoom` & `CalcdexBattleState`, if any,
   *   when the user leaves the room.~~
   * * As of v1.1.5, this will create a `ReactDOM.Root` from the `Showdown.ClientHtmlRoom`'s `el` (`HTMLDivElement`),
   *   accessible under the `reactRoot` property.
   *   - When this room's `requestLeave()` is called (typically by `app.leaveRoom()` or the user closing the tab),
   *     `reactRoot.unmount()` will be automatically called.
   * * As of v1.3.0, this is now inside the `CalcdexClassicBootstrapper` to keep logic separate from those used for the
   *   rewritten `'preact'` Showdown client.
   *   - As a result, the Redux `store` is no longer a function argument.
   *
   * @since 1.0.3
   */
  public static createCalcdexRoom(
    battleId: string,
    focus?: boolean,
  ): Showdown.ClientHtmlRoom {
    if (!detectClassicHost(window) || !battleId) {
      return null;
    }

    const { rootState, store } = this.Adapter || {};
    const settings = rootState?.showdex?.settings?.calcdex;

    // if the openOnPanel setting is falsy, default to the 'showdown' behavior
    const side = settings?.openOnPanel === 'right' || (
      (!settings?.openOnPanel || settings.openOnPanel === 'showdown')
        && !window.Dex?.prefs('rightpanelbattles')
    );

    const calcdexRoomId = this.getCalcdexRoomId(battleId);
    const calcdexRoom = (this as unknown as typeof BootdexClassicBootstrappable).createHtmlRoom(calcdexRoomId, 'Calcdex', {
      side,
      icon: 'calculator',
      focus,
      maxWidth: 650,
    });

    if (!calcdexRoom?.el) {
      return calcdexRoom;
    }

    calcdexRoom.reactRoot = ReactDOM.createRoot(calcdexRoom.el);
    calcdexRoom.requestLeave = () => {
      // check if there's a corresponding ClientBattleRoom for this Calcdex room
      // (app should be available here; otherwise, createHtmlRoom() would've returned null)
      const battle = (window.app.rooms?.[battleId] as Showdown.ClientBattleRoom)?.battle;

      if (battle?.id) {
        delete battle.calcdexHtmlRoom;
      }

      // unmount the reactRoot we created earlier
      // (if destroyOnClose is false, the reactRoot will be recreated when the user selects the
      // battle in the Hellodex instances list [via openCalcdexInstance() -> createCalcdexRoom()])
      calcdexRoom.reactRoot?.unmount?.();

      // we need to grab a fresher version of the state when this function runs
      // (i.e., do NOT use calcdexSettings here! it may contain a stale version of the settings)
      const freshSettings = rootState?.showdex?.settings?.calcdex;

      if (freshSettings?.destroyOnClose) {
        // clean up allocated memory from Redux for this Calcdex instance
        store.dispatch(calcdexSlice.actions.destroy(battleId));

        if (battle?.id) {
          // technically calcdexReactRoot would only exist for battle-overlayed Calcdexes,
          // but calling it here just in case I screwed something up LOL
          battle.calcdexReactRoot?.unmount?.();
          battle.calcdexDestroyed = true;
        }
      }

      // actually leave the room
      return true;
    };

    return calcdexRoom;
  }

  protected get battleRoom() {
    if (
      !detectClassicHost(window)
        || !nonEmptyObject(window.app?.rooms)
        || !this.battleId?.startsWith?.('battle-')
    ) {
      return null;
    }

    return window.app.rooms[this.battleId] as Showdown.ClientBattleRoom;
  }

  protected get battle() {
    return this.battleRoom?.battle;
  }

  protected get battleRequest() {
    return this.battleRoom?.request;
  }

  protected override startTimer(): void {
    super.startTimer(CalcdexClassicBootstrapper.scope);
  }

  protected override patchCalcdexIdentifier(): void {
    this.startTimer();

    if (!detectClassicHost(window)) {
      return void this.endTimer('(bad classic)', window.__SHOWDEX_HOST);
    }

    if (!this.battle?.id) {
      return void this.endTimer('(bad battle.id)');
    }

    if (this.battle.calcdexIdPatched) {
      return void this.endTimer('(already patched)');
    }

    AllPlayerKeys.forEach((playerKey) => {
      if (!(playerKey in this.battle) || typeof this.battle[playerKey]?.addPokemon !== 'function') {
        return;
      }

      l.debug(
        'Overriding side.addPokemon() of player', playerKey,
        '\n', 'battle.id', this.battle.id,
      );

      const side = this.battle[playerKey];
      const addPokemon = side.addPokemon.bind(side) as Showdown.Side['addPokemon'];

      side.addPokemon = (...argv) => this.patchClientCalcdexIdentifier(playerKey, addPokemon, argv);
    });

    this.startTimer();

    l.debug(
      'Overriding updateSide() of the current battleRoom',
      '\n', 'battle.id', this.battle.id,
    );

    const updateSide = this.battleRoom.updateSide.bind(this.battleRoom) as Showdown.ClientBattleRoom['updateSide'];

    this.battleRoom.updateSide = () => {
      // grab a copy of myPokemon[] before updateSide() unleashes valhalla on it
      const myPokemon = [...(this.battleRoom.battle?.myPokemon || [])];

      // now run the original function, which will directly mutate myPokemon[] from the battleRoom.requests.side.pokemon[]
      updateSide();

      /* l.debug(
        'updateSide()',
        '\n', 'battle.id', this.battle.id,
        '\n', 'myPokemon[]', '(prev)', myPokemon, '(now)', this.battle.myPokemon,
      ); */

      this.patchServerCalcdexIdentifier(myPokemon);
    };

    this.endTimer('(classic patch ok)');
  }

  protected preparePanel(): void {
    this.startTimer();

    if (!detectClassicHost(window)) {
      return void this.endTimer('(bad classic)', window.__SHOWDEX_HOST);
    }

    if (!this.battle?.id) {
      return void this.endTimer('(bad battle.id)');
    }

    if (this.battle.calcdexAsOverlay) {
      return void this.endTimer('(wrong render mode)', 'calcdexAsOverlay?', this.battle.calcdexAsOverlay);
    }

    // create the calcdexRoom if it doesn't already exist (shouldn't tho)
    // update (2023/04/22): createCalcdexRoom() will also create a ReactDOM.Root under reactRoot
    if (!this.battle.calcdexHtmlRoom) {
      this.battle.calcdexHtmlRoom = CalcdexClassicBootstrapper.createCalcdexRoom(this.battleId, true);
      this.battle.calcdexRoomId = this.battle.calcdexHtmlRoom?.id as Showdown.RoomID; // bacc compat w/ the new v1.3.0 bootloader system for preact
    }

    if (!this.battle.calcdexRoomId) {
      return void this.endTimer('(bad calcdexRoomId)', this.battle.calcdexRoomId);
    }

    const { Adapter, getCalcdexRoomId } = CalcdexClassicBootstrapper;

    // handle destroying the Calcdex when leaving the battleRoom
    const requestLeave = this.battleRoom.requestLeave.bind(this.battleRoom) as Showdown.ClientBattleRoom['requestLeave'];

    this.battleRoom.requestLeave = (e) => {
      const shouldLeave = requestLeave(e);

      // ForfeitPopup probably appeared
      if (!shouldLeave) {
        // similar to the battle overlay, we'll override the submit() handler of the ForfeitPopup
        const forfeitPopup = window.app.popups.find((p) => (p as Showdown.ForfeitPopup).room === this.battleRoom);

        if (typeof forfeitPopup?.submit === 'function') {
          l.debug(
            'Overriding submit() of spawned ForfeitPopup in app.popups[]...',
            '\n', 'battle.id', this.battle.id,
          );

          const submitForfeit = forfeitPopup.submit.bind(forfeitPopup) as typeof forfeitPopup.submit;

          // unlike the battle overlay, we'll only close if configured to (and destroy if closing the room)
          forfeitPopup.submit = (...args) => {
            const calcdexRoomId = getCalcdexRoomId(this.battleId);

            // grab the current settings
            const { calcdex: settings } = Adapter.rootState?.showdex?.settings || {};

            if (settings?.closeOn !== 'never' && calcdexRoomId && calcdexRoomId in (window.app.rooms || {})) {
              // this will trigger calcdexRoom's requestLeave() handler,
              // which may destroy the state depending on the user's settings
              window.app.leaveRoom(calcdexRoomId);
            }

            this.updateBattleRecord('loss');

            // call ForfeitPopup's original submit() handler
            // (note: should be a `void` return, but `return`'ing here shouldn't hurt in case it isn't)
            return submitForfeit(...args);
          };
        }

        // don't actually leave the room, as requested by requestLeave()
        return false;
      }

      // actually leave the room
      return true;
    };

    this.endTimer('(panel prep ok)');
  }

  protected prepareOverlay(): void {
    this.startTimer();

    if (!detectClassicHost(window)) {
      return void this.endTimer('(bad classic)', window.__SHOWDEX_HOST);
    }

    if (!this.battle?.id) {
      return void this.endTimer('(bad battle.id)');
    }

    if (!this.battle.calcdexAsOverlay) {
      return void this.endTimer('(wrong render mode)', 'calcdexAsOverlay?', this.battle.calcdexAsOverlay);
    }

    if (typeof this.battleRoom?.$controls?.find !== 'function') {
      return void this.endTimer('(bad battleRoom)', this.battleRoom);
    }

    const { Adapter } = CalcdexClassicBootstrapper;

    const {
      $el,
      $chatFrame,
      $controls,
      $userList,
    } = this.battleRoom;

    // local helper function that will be called once the native BattleRoom controls are rendered in the `overrides` below
    // (warning: most of this logic is from trial & error tbh -- may make very little sense LOL)
    const injectToggleButton = (): void => {
      // grab the latest overlayVisible value
      const state = Adapter.rootState?.calcdex?.[this.battle.id];
      const { overlayVisible: visible } = state || {};

      const toggleButtonIcon = visible ? 'close' : 'calculator';
      const toggleButtonLabel = (
        typeof tRef.value === 'function'
          && tRef.value(`calcdex:overlay.control.${visible ? '' : 'in'}activeLabel`, '')
      ) || `${visible ? 'Close' : 'Open'} Calcdex`;

      const $existingToggleButton = $controls.find('button[name*="toggleCalcdexOverlay"]');
      const hasExistingToggleButton = !!$existingToggleButton.length;

      const $toggleButton = hasExistingToggleButton ? $existingToggleButton : $(`
        <button
          class="button"
          style="float: right;"
          type="button"
          name="toggleCalcdexOverlay"
        >
          <i class="fa fa-${toggleButtonIcon}"></i>
          <span>${toggleButtonLabel}</span>
        </button>
      `);

      // update the existing $toggleButton's children
      if (hasExistingToggleButton) {
        $toggleButton.children('i.fa').attr('class', `fa fa-${toggleButtonIcon}`);
        $toggleButton.children('span').text(toggleButtonLabel);
      }

      // $floatingContainer typically contains spectator & replay controls
      // (asterisk [*] in the CSS selector [style*="<value>"] checks if style includes the <value>)
      const $floatingContainer = $controls.find('div.controls span[style*="float:"]');

      if ($floatingContainer.length) {
        $floatingContainer.css('text-align', 'right');
        $toggleButton.css('float', ''); // since the container itself floats!
      }

      // $waitingContainer typically contains the "Waiting for opponent..." message
      const $waitingContainer = $controls.find('div.controls > p:first-of-type');

      // $whatDoContainer typically contains player controls (move/Pokemon selection)
      const $whatDoContainer = $controls.find('div.controls .whatdo'); // wat it dooo ??

      // doesn't matter if $whatDoContainer is empty since it'll be checked again when
      // for $controlsTarget below (by checking $controlsContainer's length)
      const $controlsContainer = $floatingContainer.length
        ? $floatingContainer
        : $waitingContainer.length
          ? $waitingContainer
          : $whatDoContainer;

      // add some spacing between a button or the control container's right side
      $toggleButton.css('margin-right', 7);

      // only add the $toggleButton if there wasn't one to begin with, obviously
      if (hasExistingToggleButton) {
        return;
      }

      // all this positioning work, which would likely break if they ever changed the HTML... LOL
      const $controlsTarget = $controlsContainer.length
        ? $controlsContainer
        : $controls;

      // button's name could be "startTimer" or "setTimer",
      // hence why we're only matching names containing (`name*=`) "Timer" lmao
      const $timerButton = $controlsTarget.find('button[name*="Timer"]');
      const hasTimerButton = !!$timerButton.length;

      if (hasTimerButton) {
        $toggleButton.insertAfter($timerButton);
      } else {
        $controlsTarget[hasTimerButton ? 'append' : 'prepend']($toggleButton);
      }
    };

    // there are lots of different functions for rendering the controls,
    // which all need to be individually overridden :o
    const overrides: BattleRoomOverride[] = ([
      'updateControls', // p, div.controls p
      'updateControlsForPlayer', // conditionally calls one of the update*Controls() below
      'updateMoveControls', // div.controls .whatdo
      'updateSwitchControls', // div.controls .whatdo
      'updateTeamControls', // div.controls .whatdo
      'updateWaitControls', // div.controls p
    ] as FunctionPropertyNames<Showdown.ClientBattleRoom>[]).map((name) => ({
      name,
      native: typeof this.battleRoom[name] === 'function'
        ? this.battleRoom[name].bind(this.battleRoom) as Showdown.ClientBattleRoom[typeof name]
        : null,
    })).filter((o) => typeof o.native === 'function');

    // this could've been more disgusting by chaining it directly to the filter,
    // but I sense my future self will appreciate the slightly improved readability lmao
    overrides.forEach(({
      name,
      native,
    }) => {
      // sometimes you gotta do what you gotta do to get 'er done
      // (but this definitely hurts my soul lmfao)
      (this.battleRoom as unknown as Record<FunctionPropertyNames<Showdown.ClientBattleRoom>, (...args: unknown[]) => void>)[name] = (
        ...args: unknown[]
      ) => {
        // run the native function first since it modifies $controls (from battleRoom)
        native(...args);
        injectToggleButton();
      };
    });

    // $rootContainer[0] references the underlying HTMLDivElement created below,
    // which will house the React DOM root
    const $rootContainer = $(`<div class="${styles.overlayContainer}"></div>`);

    // since the Calcdex overlay is initially hidden,
    // make sure we apply the display: none; so that the chat isn't blocked by an invisible div
    $rootContainer.css('display', 'none');

    // button handler (which is the value of its name prop)
    this.battleRoom.toggleCalcdexOverlay = (): void => {
      // battle.calcdexOverlayVisible = !battle.calcdexOverlayVisible;

      const state = Adapter.rootState?.calcdex?.[this.battle.id];
      const visible = !state?.overlayVisible;

      Adapter.store.dispatch(calcdexSlice.actions.update({
        scope: `${l.scope}:prepareOverlay():battleRoom.toggleCalcdexOverlay()`,
        battleId: this.battle.id,
        overlayVisible: visible,
      }));

      const battleRoomStyles: React.CSSProperties = {
        display: visible ? 'block' : 'none',
        opacity: visible ? 0.3 : 1,
        visibility: visible ? 'hidden' : 'visible',
      };

      $rootContainer.css('display', battleRoomStyles.display);
      $chatFrame.css('opacity', battleRoomStyles.opacity);
      $el.find('.battle-log-add').css('opacity', battleRoomStyles.opacity);
      $userList.css('visibility', battleRoomStyles.visibility);

      // omfg didn't know $chatbox was constantly being focused, which was the source of my distress >:(
      // you won't believe how many hours I spent googling to find the source of this problem,
      // which was dropdowns would open, then immediately close. happened only when opening as a
      // Battle Overlay... & it was very inconsistent... LOL
      // (shoutout to SpiffyTheSpaceman for helping me debug this in < 5 minutes while blasted af)
      // also note that $chatbox comes & goes, so sometimes it's null, hence the check
      if (this.battleRoom.$chatbox?.length) {
        this.battleRoom.$chatbox.prop('disabled', visible);
      }

      // found another one lol (typically in spectator mode)
      if (this.battleRoom.$chatAdd?.length) {
        const $joinButton = this.battleRoom.$chatAdd.find('button');

        if ($joinButton.length) {
          $joinButton.prop('disabled', visible);
        }
      }

      // for mobile (no effect on desktops), prevent pinch-to-zoom & auto-zoom into focused <input>'s
      if (visible) {
        const $existingMeta = $('meta[data-calcdex*="no-mobile-zoom"]');

        if ($existingMeta.length) {
          $existingMeta.attr('content', 'width=device-width, initial-scale=1, maximum-scale=1');
        } else {
          $('head').append(`
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1, maximum-scale=1"
              data-calcdex="no-mobile-zoom"
            />
          `);
        }
      } else {
        // allow pinch zooming again once the Calcdex is closed
        // (warning: not enough to just remove the meta tag as the browser will continue to enforce the no pinch zoom!)
        $('meta[data-calcdex*="no-mobile-zoom"]').attr('content', 'width=device-width, user-scalable=yes');
      }

      // most BattleRoom button callbacks seem to do this at the end lol
      this.battleRoom.updateControls();
    };

    // render the $rootContainer in the entire battleRoom itself
    // (couldn't get it to play nicely when injecting into $chatFrame sadge)
    // (also, $rootContainer's className is the .overlayContainer module to position it appropriately)
    $el.append($rootContainer);
    this.battle.calcdexReactRoot = ReactDOM.createRoot($rootContainer[0]);

    // handle destroying the Calcdex when leaving the battleRoom
    const requestLeave = this.battleRoom.requestLeave.bind(this.battleRoom) as Showdown.ClientBattleRoom['requestLeave'];

    this.battleRoom.requestLeave = (e): boolean => {
      const shouldLeave = requestLeave(e);

      // ForfeitPopup probably appeared
      if (!shouldLeave) {
        // attempt to find the ForfeitPopup to override its submit() callback to destroy the Calcdex
        // (otherwise, the state will remain in the Hellodex since the battleRoom's overrides didn't fire)
        const forfeitPopup = window.app.popups.find((p) => (p as Showdown.ForfeitPopup).room === this.battleRoom);

        if (typeof forfeitPopup?.submit === 'function') {
          l.debug(
            'Overriding submit() of spawned ForfeitPopup in app.popups[]...',
            '\n', 'battleId', this.battleId,
          );

          const submitForfeit = forfeitPopup.submit.bind(forfeitPopup) as typeof forfeitPopup.submit;

          forfeitPopup.submit = (...args): void => {
            // clean up allocated memory from React & Redux for this Calcdex instance
            this.battle.calcdexReactRoot?.unmount?.();
            Adapter.store.dispatch(calcdexSlice.actions.destroy(this.battleId));

            // update the Hellodex W/L battle record
            this.updateBattleRecord('loss');

            // call the original function
            return submitForfeit(...args);
          };
        }

        // don't actually leave the room, as requested by requestLeave()
        return false;
      }

      this.battle.calcdexReactRoot?.unmount?.();
      this.battle.calcdexStateInit = false;
      this.battle.calcdexDestroyed = true;
      Adapter.store.dispatch(calcdexSlice.actions.destroy(this.battle.id));

      // actually leave the room
      return true;
    };

    this.endTimer('(overlay prep ok)');
  }

  protected renderCalcdex(dom: ReactDOM.Root): void {
    if (!detectClassicHost(window) || !this.battleId || !dom) {
      return;
    }

    const {
      Adapter,
      Manager,
      openUserPopup,
    } = CalcdexClassicBootstrapper as unknown as typeof BootdexClassicBootstrappable;

    CalcdexDomRenderer(dom, {
      store: Adapter.store,
      battleId: this.battleId,
      onUserPopup: openUserPopup,
      onRequestHellodex: () => void Manager?.openHellodex(),
      onRequestHonkdex: (id) => void Manager?.openHonkdex(id),
      onCloseOverlay: () => void this.battleRoom?.toggleCalcdexOverlay?.(),
    });
  }

  public open(): void {
    if (!detectClassicHost(window) || !this.battleState?.battleId) {
      return;
    }

    const { store } = CalcdexClassicBootstrapper.Adapter || {};

    // check if the Calcdex is rendered as an overlay for this battle
    if (this.battleState.renderMode === 'overlay') {
      // if we're not even in the battleRoom anymore, destroy the state
      if (!window.app.rooms?.[this.battleId]?.id) {
        return void store.dispatch(calcdexSlice.actions.destroy(this.battleId));
      }

      const shouldFocus = !window.app.curRoom?.id || window.app.curRoom.id !== this.battleId;

      if (shouldFocus) {
        window.app.focusRoom(this.battleId);
      }

      // we'll toggle it both ways here (only if we didn't have to focus the room),
      // for use as an "emergency exit" (hehe) should the "Close Calcdex" go missing...
      // but it shouldn't tho, think I covered all the bases... hopefully :o
      if (!shouldFocus || !this.battleState.overlayVisible) {
        this.battleRoom.toggleCalcdexOverlay?.();
      }

      // for overlays, this is all we'll do since the Calcdex is rendered inside the battle frame
      // (entirely possible to do more like reopen as a tab later, but for v1.0.3, nah)
      return;
    }

    // check if the Calcdex tab is already open
    const calcdexRoomId = CalcdexClassicBootstrapper.getCalcdexRoomId(this.battleId);

    if (calcdexRoomId in window.app.rooms) {
      // no need to call app.topbar.updateTabbar() since app.focusRoomRight() will call it for us
      // (app.focusRoomRight() -> app.updateLayout() -> app.topbar.updateTabbar())
      window.app.focusRoomRight(calcdexRoomId);
    } else {
      // at this point, we need to recreate the room
      // (we should also be in the 'panel' renderMode now)
      const calcdexRoom = CalcdexClassicBootstrapper.createCalcdexRoom(this.battleId, true);

      this.renderCalcdex(calcdexRoom.reactRoot);

      // if the battleRoom exists, attach the created room to the battle object
      if (this.battleRoom?.battle?.id) {
        this.battleRoom.battle.calcdexDestroyed = false; // just in case
        this.battleRoom.battle.calcdexHtmlRoom = calcdexRoom;
      }
    }

    // refocus the battleRoom that the tabbed Calcdex pertains to, if still joined
    if ((!window.app.curRoom?.id || window.app.curRoom.id !== this.battleId) && this.battleId in window.app.rooms) {
      window.app.focusRoom(this.battleId);
    }
  }

  public close(): void {
    if (!detectClassicHost(window) || !this.battleId || !nonEmptyObject(window.app?.rooms)) {
      return;
    }

    const { Adapter, getCalcdexRoomId } = CalcdexClassicBootstrapper;
    const calcdexRoomId = getCalcdexRoomId(this.battleId);

    if (window.app.rooms[calcdexRoomId]) {
      window.app.leaveRoom(calcdexRoomId);
    }

    if (this.battleRoom?.id && !Adapter.rootState?.calcdex?.[this.battleId]?.active) {
      window.app.leaveRoom(this.battleId);
    }
  }

  public destroy(): void {
    if (!detectClassicHost(window) || !this.battleId) {
      return;
    }

    const { Adapter } = CalcdexClassicBootstrapper as unknown as typeof BootdexClassicBootstrappable;

    if (this.battle?.calcdexStateInit) {
      this.battle.calcdexReactRoot?.unmount?.();
      this.battle.calcdexStateInit = false;
      this.battle.calcdexDestroyed = true;
    }

    this.close();
    Adapter.removeBattleReceiver(this.battleId);
    Adapter.store.dispatch(calcdexSlice.actions.destroy(this.battleId));
  }

  public run(): void {
    this.startTimer();

    if (!detectClassicHost(window)) {
      return void this.endTimer('(bad classic)', window.__SHOWDEX_HOST);
    }

    l.silly(
      'Calcdex classic bootstrapper was invoked;',
      'determining if there\'s anything to do...',
      '\n', 'battleId', this.battleId,
    );

    if (!this.battleId?.startsWith?.('battle-')) {
      l.debug(
        'Calcdex classic bootstrap request was ignored for battleId', this.battleId,
        'since it\'s not a Showdown.ClientBattleRoom',
      );

      return void this.endTimer('(wrong room)', this.battleId);
    }

    const { Adapter, getCalcdexRoomId } = CalcdexClassicBootstrapper;
    const { hasSinglePanel } = CalcdexClassicBootstrapper as unknown as typeof BootdexClassicBootstrappable;

    if (!this.battle?.id) {
      // we'd typically reach this point when the user forfeits through the popup
      if (!this.battleState?.battleId) {
        l.debug(
          'Calcdex classic bootstrap request was ignored for battleId', this.battleId,
          'since no proper Showdown.Battle exists within the current Showdown.ClientBattleRoom',
        );

        return void this.endTimer('(bad battle)', this.battleId);
      }

      if (this.battleState?.active) {
        Adapter.store.dispatch(calcdexSlice.actions.update({
          scope: l.scope,
          battleId: this.battleId,
          active: false,
        }));
      }

      const calcdexRoomId = getCalcdexRoomId(this.battleId);

      if (
        this.battleState.renderMode === 'panel'
          && this.calcdexSettings?.closeOn !== 'never'
          && calcdexRoomId in window.app.rooms
      ) {
        l.debug(
          'Leaving the calcdexRoom', calcdexRoomId, 'w/ a destroyed battle due to the user\'s settings...',
          '\n', 'battleId', this.battleId,
          '\n', 'state', this.battleState,
          '\n', 'settings', this.calcdexSettings,
        );

        // this will destroy the Calcdex state if configured to, via calcdexRoom's requestLeave() handler
        window.app.leaveRoom(calcdexRoomId);

        // update (2023/02/04): did I forget a return here? ...probably cause it keeps triggering the return from
        // the typeof battle?.subscribe check
        return void this.endTimer('(calcdex destroyed)');
      }

      l.debug(
        'Calcdex for battleId', this.battleId, 'exists in state, but battle was forcibly ended, probably.',
        '\n', 'battle', this.battle,
        '\n', 'battleRoom', this.battleRoom,
        '\n', 'state', this.battleState,
      );

      // update (2023/02/04): might as well put a return here too since this is part of the !battle?.id handler
      return void this.endTimer('(battle destroyed)', this.battleId);
    }

    if (this.initDisabled) {
      l.debug(
        'Calcdex classic bootstrap request was ignored for battleId', this.battleId,
        'since the battle is marked as nonexistent & shouldn\'t be initialized',
        '\n', 'stepQueue[]', '(match)', this.battle.stepQueue.find((s) => s?.startsWith('|noinit|nonexistent|')),
        '\n', 'battle', this.battle,
      );

      return void this.endTimer('(noinit nonexistent)', this.battleId);
    }

    if (typeof this.battle?.subscribe !== 'function') {
      l.warn(
        'Must have some jank battle object cause battle.subscribe() is apparently type',
        wtf(this.battle?.subscribe), // eslint-disable-line @typescript-eslint/unbound-method
      );

      return void this.endTimer('(bad subscriber)', this.battleId);
    }

    // delaying initialization if the battle hasn't instantiated all the players yet
    // (which we can quickly determine by the existence of '|player|' steps in the stepQueue)
    if (!this.battle.stepQueue?.length || !this.battle.stepQueue.some((q) => q?.startsWith('|player|'))) {
      l.debug(
        'Ignoring Calcdex classic init due to uninitialized players in battle',
        '\n', 'stepQueue[]', this.battle.stepQueue,
        '\n', 'battle.id', this.battle.id,
        '\n', 'battle', this.battle,
      );

      return void this.endTimer('(uninit players)', this.battleId);
    }

    // don't process this battle if we've already added (or forcibly prevented) the filth
    if (this.battle.calcdexInit) {
      // force a battle sync if we've received some data, but the active battle is just idling
      if (this.battle.calcdexStateInit && this.battle.atQueueEnd) {
        this.battle.subscription('atqueueend');
      }

      return void this.endTimer('(already filthy)', this.battleId);
    }

    // note: anything below here executes once per battle
    const authPlayerKey = detectAuthPlayerKeyFromBattle(this.battle);

    /** @todo `this.battle.calcdex*` hard prop assignemtns are temp until `CalcdexHostBattle` c: */
    // determine if we should even init the Calcdex based on the openOnStart setting
    // (purposefully ignoring 'always', obviously)
    this.battle.calcdexDisabled = this.calcdexSettings?.openOnStart === 'never'
      || (this.calcdexSettings?.openOnStart === 'playing' && !authPlayerKey)
      || (this.calcdexSettings?.openOnStart === 'spectating' && !!authPlayerKey);

    if (this.battle.calcdexDisabled) {
      return void this.endTimer('(calcdex denied)', this.battleId);
    }

    // update (2023/02/01): used to be in the battle object as calcdexReactRoot, but post-refactor, we no longer
    // need to keep a reference in the battle object (Hellodex will create a new root via ReactDOM.createRoot() btw)
    // update (2023/04/22): jk, we need a reference to it now in order to call calcdexReactRoot.unmount() --
    // just in the debug logs that the React roots of already closed battles (in the same session) are still mounted!
    // the ReactDOM.Root will be stored in battle.calcdexRoom.reactRoot for panel tabs & (rather confusingly)
    // battle.calcdexReactRoot for battle overlays (potentially could rename it to calcdexOverlayReactRoot... LOL)
    // let calcdexReactRoot: ReactDOM.Root;

    // note: same inversion the preact CalcdexPreactBattle had -- 'showdown' is the *Auto* openAs, so it's the one
    // that should defer to hasSinglePanel(); the guard has to exclude the explicit 'panel' instead. (see the note
    // over there.) classic gets it too since both read the same setting & the same contract.
    this.battle.calcdexAsOverlay = this.calcdexSettings.openAs === 'overlay'
      || (this.calcdexSettings.openAs !== 'panel' && hasSinglePanel());

    if (!this.battle.calcdexStateInit) {
      this.initCalcdexState();
    }

    void (this.battle.calcdexAsOverlay ? this.prepareOverlay() : this.preparePanel());

    // update (2023/02/01): we're now only rendering the Calcdex once since React is no longer
    // dispatching battle updates (we're dispatching them out here in the bootstrapper).
    // state mutations in Redux should trigger necessary UI re-renders within React.
    // (also probably no longer need to reference the calcdexReactRoot in the battle object now tbh)
    // update (2023/04/22): nope -- we still do! we have to call calcdexReactRoot.unmount(),
    // which obviously won't be available on subsequent bootstrapper invocations as a local var,
    // so... back in the `battle` (for overlays) or `calcdexRoom` (for tabs) you go!
    const calcdexReactRoot = this.battle.calcdexReactRoot || this.battle.calcdexHtmlRoom?.reactRoot;

    if (!calcdexReactRoot) {
      l.error(
        'ReactDOM root hasn\'t been initialized, despite completing the classic bootstrap;',
        'something is horribly wrong here!',
        '\n', 'battleId', this.battle.id,
        '\n', 'calcdexReactRoot', '(typeof)', wtf(calcdexReactRoot), calcdexReactRoot,
        '\n', 'battle', this.battle,
        '\n', 'battleRoom', this.battleRoom,
      );

      return void this.endTimer('(bad react root)', this.battleId);
    }

    this.patchCalcdexIdentifier();

    /* l.debug(
      'Rendering Calcdex for', this.battle.id,
      // '\n', 'nonce', '(now)', this.battle.nonce || initNonce,
      // '\n', 'request', this.battleRoom.request,
      '\n', 'battle', this.battle,
      '\n', 'battleRoom', this.battleRoom,
    ); */

    this.renderCalcdex(calcdexReactRoot);

    l.debug(
      'About to inject some real filth into battle.subscribe()...',
      '\n', 'battleId', this.battleId,
      '\n', 'battle.subscription()', '(typeof)', wtf(this.battle.subscription),
      '\n', 'battle', this.battle,
    );

    this.prevBattleSubscription = this.battle.subscription?.bind?.(this.battle) as Showdown.Battle['subscription'];
    this.battle.subscribe(this.battleSubscription);
    this.battle.calcdexInit = true;

    // force a callback after rendering
    // update (2023/02/04): bad idea, sometimes leads to a half-initialized battle object where there's
    // only one player (which breaks the syncing); downside is that it doesn't appear to the user that the
    // Calcdex is loading that fast, but it loads with the battle frame, so it isn't the worst thing ever
    // update (2023/02/06): now checking if we're already at the queue end, which could happen if you refresh
    // the page mid-battle or join a spectating game; otherwise, the Calcdex won't appear until the players
    // do something (e.g., choose an option, turn on the timer, etc.) that triggers the subscription callback
    if (calcdexReactRoot && this.battle.atQueueEnd) {
      /* l.debug(
        'Forcing a battle sync via battle.subscription() since the battle is atQueueEnd',
        '\n', 'battle.atQueueEnd', this.battle.atQueueEnd,
        '\n', 'battle', this.battle,
        '\n', 'battleRoom', this.battleRoom,
      ); */

      this.battle.subscription('atqueueend');
    }

    this.endTimer('(bootstrap complete)', this.battleId);
  }
}
