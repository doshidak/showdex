import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { Provider as ReduxProvider } from 'react-redux';
import { ErrorBoundary } from '@showdex/components/debug';
import { calcdexSlice } from '@showdex/redux/store';
import {
  createCalcdexRoom,
  // createSideRoom,
  // getActiveBattle,
  getBattleRoom,
  getCalcdexRoomId,
  // getCalcdexRoomId,
  // getSideRooms,
  hasSinglePanel,
} from '@showdex/utils/app';
import { detectAuthPlayerKeyFromBattle } from '@showdex/utils/battle';
import { calcBattleCalcdexNonce } from '@showdex/utils/calc';
import { logger } from '@showdex/utils/debug';
import type { ShowdexBootstrapper } from '@showdex/main';
import type { CalcdexSliceState, RootStore, ShowdexSliceState } from '@showdex/redux/store';
import { Calcdex } from './Calcdex';
import { CalcdexError } from './CalcdexError';
import styles from './Calcdex.module.scss';

/**
 * Object containing the function's `name` and its binded `native` function.
 *
 * * Probably could've been typed better, but not trying to wrangle TypeScript rn lol.
 *
 * @since 1.0.3
 */
export interface BattleRoomOverride<
  TFunc extends (...args: unknown[]) => void = (...args: unknown[]) => void,
> {
  name: FunctionPropertyNames<BattleRoom>;
  native: TFunc;
}

const l = logger('@showdex/pages/Calcdex/Calcdex.bootstrap');

export const renderCalcdex = (
  dom: ReactDOM.Root,
  store: RootStore,
  battle?: Showdown.Battle | string,
): void => dom.render((
  <ReduxProvider store={store}>
    <ErrorBoundary
      component={CalcdexError}
      battleId={typeof battle === 'string' ? battle : battle?.id}
    >
      <Calcdex
        battle={typeof battle === 'string' ? undefined : battle}
        battleId={typeof battle === 'string' ? battle : undefined}
      />
    </ErrorBoundary>
  </ReduxProvider>
));

export const calcdexBootstrapper: ShowdexBootstrapper = (
  store,
  _data,
  roomid,
) => {
  l.debug(
    'Calcdex bootstrapper was invoked;',
    'determining if there\'s anything to do...',
    '\n', 'roomid', roomid,
  );

  if (!roomid?.startsWith?.('battle-')) {
    l.debug(
      'Calcdex bootstrap request was ignored for roomid', roomid,
      'since it\'s not a BattleRoom',
    );

    return;
  }

  const battleRoom = getBattleRoom(roomid);

  const {
    $el,
    $chatFrame,
    $controls,
    $userList,
    battle,
    // tooltips,
  } = battleRoom;

  if (!battle?.id) {
    const state = store.getState()?.calcdex as CalcdexSliceState;

    // we'd typically reach this point when the user forfeits through the popup
    if (roomid in (state || {})) {
      const battleState = state[roomid];

      if (battleState?.active) {
        store.dispatch(calcdexSlice.actions.update({
          battleId: roomid,
          active: false,
        }));
      }

      const settings = (store.getState()?.showdex as ShowdexSliceState)?.settings?.calcdex;
      const calcdexRoomId = getCalcdexRoomId(roomid);

      l.debug(
        '\n', 'settings.closeOnEnd', settings?.closeOnEnd,
        '\n', 'battleState.renderMode', battleState.renderMode,
        '\n', 'calcdexRoomId', calcdexRoomId,
        '\n', 'calcdexRoomId in app.rooms?', calcdexRoomId in app.rooms,
      );

      // this would only apply in the tabbed panel mode, obviously
      if (battleState.renderMode === 'panel' && settings?.closeOnEnd && calcdexRoomId in app.rooms) {
        l.debug(
          'Leaving calcdexRoom with destroyed battle due to user settings...',
          '\n', 'calcdexRoomId', calcdexRoomId,
        );

        if (settings.destroyOnClose) {
          store.dispatch(calcdexSlice.actions.destroy(roomid));
        }

        app.leaveRoom(calcdexRoomId);
      }

      l.debug(
        'Calcdex for roomid', roomid, 'exists in state, but battle was forcibly ended, probably.',
        '\n', 'battleRoom', battleRoom,
        '\n', 'battleState', battleState,
      );
    } else {
      l.debug(
        'Calcdex bootstrap request was ignored for roomid', roomid,
        'since no proper battle object exists within the current BattleRoom',
      );
    }

    return;
  }

  if (typeof battle?.subscribe !== 'function') {
    l.warn(
      'Must have some jank battle object cause battle.subscribe() is apparently type',
      typeof battle?.subscribe,
    );

    return;
  }

  const {
    subscription,
    prevSubscription,
    subscriptionDirty,
  } = battle;

  // don't process this battle if we've already added (or forcibly prevented) the filth
  if (subscriptionDirty) {
    return;
  }

  // note: anything below here executes once per battle
  const calcdexSettings = (store.getState()?.showdex as ShowdexSliceState)?.settings?.calcdex;

  // determine if we should even init the Calcdex based on the openOnStart setting
  // (purposefully ignoring 'always', obviously)
  if (['playing', 'spectating', 'never'].includes(calcdexSettings?.openOnStart)) {
    const authPlayer = !!detectAuthPlayerKeyFromBattle(battle);

    // for 'playing', checking if there's no authPlayer cause the user would be a spectator;
    // likewise for 'spectating', checking if there is an authPlayer cause the user would be a player
    const preventInit = calcdexSettings.openOnStart === 'never'
      || (calcdexSettings.openOnStart === 'playing' && !authPlayer)
      || (calcdexSettings.openOnStart === 'spectating' && authPlayer);

    if (preventInit) {
      // const authName = getAuthUsername();

      // l.debug('Preventing Calcdex init due to openOnStart', calcdexSettings.openOnStart, 'with authName', authName);

      // prevent bootstrapping on subsequent bootstrapper calls
      // if (calcdexSettings.openOnStart !== 'playing' || authName) {
      //   battle.subscriptionDirty = true;
      //   battle.calcdexDestroyed = true; // just in case lol
      // }

      return;
    }
  }

  const openAsPanel = !calcdexSettings?.openAs
    || calcdexSettings.openAs === 'panel'
    || (calcdexSettings.openAs === 'showdown' && !hasSinglePanel());

  if (openAsPanel) {
    // create the calcdexRoom if it doesn't already exist (shouldn't tho)
    if (!battle.calcdexRoom) {
      // const calcdexRoomId = getCalcdexRoomId(roomid);

      // l.debug(
      //   'Creating a side-room for Calcdex since battle.calcdexRoom is falsy...',
      //   '\n', 'id', calcdexRoomId,
      //   '\n', 'title', 'Calcdex',
      // );

      // battle.calcdexRoom = createSideRoom(calcdexRoomId, 'Calcdex', {
      //   icon: 'calculator',
      //   focus: true,
      // });

      battle.calcdexRoom = createCalcdexRoom(roomid, true, store);

      // battle.calcdexRoom.requestLeave = () => {
      //   // we need to grab a fresher version of the state when this function runs
      //   // (i.e., do NOT use calcdexSettings here! it may contain a stale version of the settings)
      //   const settings = (store.getState()?.showdex as ShowdexSliceState)?.settings?.calcdex;
      //
      //   if (settings?.destroyOnClose) {
      //     if (battle.id) {
      //       store.dispatch(calcdexSlice.actions.destroy(battle.id));
      //       battle.calcdexDestroyed = true;
      //
      //       delete battle.calcdexRoom;
      //       delete battle.calcdexReactRoot;
      //     }
      //
      //     // actually leave the room
      //     // return true; // (below)
      //   }
      //
      //   // hide the tab (tabHidden is used to ignore tab renders in the overwritten app.topbar.renderRoomTab() in main)
      //   // battle.calcdexRoom.tabHidden = true;
      //   // $(`a[href*='/${calcdexRoomId}']`).parent().css('display', 'none');
      //
      //   // find the side room before the calcdexRoom to focus
      //   // const sideRoomIds = getSideRooms().map((room) => room.id);
      //   // const currentRoomId = app.curSideRoom?.id;
      //   // const calcdexRoomIndex = sideRoomIds.findIndex((id) => id === calcdexRoomId);
      //
      //   // const prevRoomId = sideRoomIds
      //   //   // .slice(0, Math.max(calcdexRoomIndex - 1, 0))
      //   //   .filter((id) => !(app.rooms[id] as unknown as HtmlRoom).tabHidden)
      //   //   .pop();
      //
      //   // currentRoomId is tracked so that we don't focus to another room when this blurred Calcdex tab is "closed"
      //   // (i.e., only focus a room if the user "closes" the currenly focused Calcdex room)
      //   // if (prevRoomId && calcdexRoomId !== prevRoomId && (!currentRoomId || calcdexRoomId === currentRoomId)) {
      //   //   app.focusRoomRight(prevRoomId);
      //   // } else if (!prevRoomId) {
      //   //   battle.calcdexRoom.hide();
      //   // }
      //
      //   // don't actually leave the room
      //   // return false;
      //
      //   // but actually tho, actually leave the room
      //   return true;
      // };
    }

    battle.calcdexReactRoot = ReactDOM.createRoot(battle.calcdexRoom.el);
  } else { // must be opening as an overlay here
    // set the initial visibility of the overlay
    battle.calcdexOverlayVisible = false;

    // local helper function that will be called once the native BattleRoom controls
    // are rendered in the `overrides` below
    // (warning: most of this logic is from trial and error tbh -- may make very little sense LOL)
    const injectToggleButton = () => {
      // grab the updated controls HTML
      // const controlsHtml = $controls?.html?.();

      if (typeof $controls?.find !== 'function') {
        return;
      }

      // grab the latest calcdexOverlayVisible value
      const {
        calcdexOverlayVisible: visible,
      } = battleRoom?.battle || {};

      // remove the outlying <p> tags so we can inject our custom button in
      // const strippedControlsHtml = controlsHtml.replace(/^<p>(.+)<\/p>$/, '$1');

      const toggleButtonIcon = visible ? 'close' : 'calculator';
      const toggleButtonLabel = `${visible ? 'Close' : 'Open'} Calcdex`;

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

      // (forgot jQuery is an accessible global here lul)
      // const toggleButtonHtml = `
      //   <button
      //     class="button"
      //     style="float:right;"
      //     type="button"
      //     name="toggleCalcdexOverlay"
      //   >
      //     <i class="fa fa-${visible ? 'close' : 'calculator'}"></i>
      //     ${visible ? 'Close' : 'Open'} Calcdex
      //   </button>
      // `.replace(/\s{2}/g, '').replace(/\s+(>|<)/g, '$1').trim();

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

      // const $existingButton = $controlsTarget.find('button[name*="Timer"], a.button');
      // const hasExistingButton = !!$existingButton.length;

      if (hasTimerButton) {
        $toggleButton.insertAfter($timerButton);
      } else {
        // $controlsTarget.html(`<p>${toggleButtonHtml}${strippedControlsHtml}</p>`);
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
    ] as FunctionPropertyNames<BattleRoom>[]).map((name) => ({
      name,
      native: typeof battleRoom[name] === 'function'
        ? battleRoom[name].bind(battleRoom) as typeof battleRoom[typeof name]
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
      (battleRoom as unknown as Record<FunctionPropertyNames<BattleRoom>, (...args: unknown[]) => void>)[name] = (
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
    battleRoom.toggleCalcdexOverlay = () => {
      battle.calcdexOverlayVisible = !battle.calcdexOverlayVisible;

      const battleRoomStyles: React.CSSProperties = {
        display: battle.calcdexOverlayVisible ? 'block' : 'none',
        opacity: battle.calcdexOverlayVisible ? 0.3 : 1,
        visibility: battle.calcdexOverlayVisible ? 'hidden' : 'visible',
      };

      $rootContainer.css('display', battleRoomStyles.display);
      $chatFrame.css('opacity', battleRoomStyles.opacity);
      $el.find('.battle-log-add').css('opacity', battleRoomStyles.opacity);
      $userList.css('visibility', battleRoomStyles.visibility);

      // omfg didn't know $chatbox was constantly being focused, which was the source of my distress >:(
      // you won't believe how many hours I spent googling to find the source of this problem,
      // which was dropdowns would open, then immediately close. happened only when opening as a
      // Battle Overlay... and it was very inconsistent... LOL
      // (shoutout to SpiffyTheSpaceman for helping me debug this in < 5 minutes while blasted af)
      // also note that $chatbox comes and goes, so sometimes it's null, hence the check
      if (battleRoom.$chatbox?.length) {
        battleRoom.$chatbox.prop('disabled', battle.calcdexOverlayVisible);
      }

      battleRoom.updateControls(); // most BattleRoom button callbacks seem to do this at the end lol
      battle.subscription('callback'); // re-render the Calcdex React root
    };

    // render the $rootContainer in the entire battleRoom itself
    // (couldn't get it to play nicely when injecting into $chatFrame sadge)
    // (also, $rootContainer's className is the .overlayContainer module to position it appropriately)
    $el.append($rootContainer);
    battle.calcdexReactRoot = ReactDOM.createRoot($rootContainer[0]);

    // handle destroying the Calcdex when leaving the battleRoom
    const requestLeave = battleRoom.requestLeave.bind(battleRoom) as typeof battleRoom.requestLeave;

    battleRoom.requestLeave = (e) => {
      const shouldLeave = requestLeave(e);

      if (!shouldLeave) {
        return false;
      }

      if (battle.id) {
        store.dispatch(calcdexSlice.actions.destroy(battle.id));
        battle.calcdexDestroyed = true;
      }

      // actually leave the room
      return true;
    };
  }

  l.debug('Overriding updateSide() of the current BattleRoom');

  const updateSide = battleRoom.updateSide.bind(battleRoom) as typeof battleRoom.updateSide;

  battleRoom.updateSide = () => {
    // grab a copy of myPokemon before updateSide() unleashes valhalla on it
    const myPokemon = [...(battleRoom.battle?.myPokemon || [])];

    // now run the original function, which will directly mutate myPokemon from
    // battleRoom.requests.side.pokemon
    updateSide();

    l.debug(
      'battleRoom.updateSide() was called!',
      '\n', 'myPokemon (prev)', myPokemon,
      '\n', 'myPokemon (now)', battleRoom.battle.myPokemon,
    );

    // if (battleRoom.battle.myPokemon.length === myPokemon.length) {
    //   return;
    // }

    let didUpdate = !myPokemon?.length
      && !!battleRoom.battle.myPokemon?.length;

    // with each updated myPokemon, see if we find a match to restore its calcdexId
    battleRoom.battle.myPokemon.forEach((pokemon) => {
      if (!pokemon?.ident || pokemon.calcdexId) {
        return;
      }

      const prevMyPokemon = myPokemon.find((p) => (
        p.ident === pokemon.ident
          || p.speciesForme === pokemon.speciesForme
          || p.details === pokemon.details
          || p.details.includes(pokemon.speciesForme)
      ));

      if (!prevMyPokemon?.calcdexId) {
        return;
      }

      pokemon.calcdexId = prevMyPokemon.calcdexId;
      didUpdate = true;
    });

    if (didUpdate && battleRoom.battle.subscriptionDirty) {
      const prevNonce = battleRoom.battle.nonce;

      battleRoom.battle.nonce = calcBattleCalcdexNonce(battleRoom.battle);

      l.debug(
        'Restored calcdexId\'s in myPokemon',
        '\n', 'nonce', '(prev)', prevNonce, '(now)', battleRoom.battle.nonce,
        '\n', 'myPokemon (prev)', myPokemon,
        '\n', 'myPokemon (now)', battleRoom.battle.myPokemon,
      );

      // battleRoom.battle.subscription('callback');
    }
  };

  l.debug(
    'battle\'s subscription isn\'t dirty yet!',
    '\n', 'About to inject some real filth into battle.subscribe()...',
    '\n', 'subscriptionDirty', subscriptionDirty,
  );

  if (typeof subscription === 'function' && typeof prevSubscription !== 'function') {
    l.debug('Remapping original subscription() function to prevSubscription()');

    /**
     * @todo don't think we need to store the original func in the battle obj
     */
    battle.prevSubscription = subscription.bind(battle) as typeof subscription;
  }

  // note: battle.subscribe() internally sets its `subscription` property to the `listener` arg
  // (in js/battle.js) battle.subscribe = function (listener) { this.subscription = listener; };
  battle.subscribe((state) => {
    l.debug(
      'battle.subscribe() for', battle?.id || '(missing battle.id)',
      '\n', 'state', state,
      '\n', 'roomid', roomid,
      '\n', 'battle', battle,
    );

    if (typeof battle.prevSubscription === 'function') {
      // l.debug('Calling the original battle.subscribe() function...');

      battle.prevSubscription(state);
    }

    if (state === 'paused') {
      l.debug('Subscription ignored cause the battle is paused or, probs more likely, ended');

      return;
    }

    // don't render if we've already destroyed the battleState
    // (via calcdexRoom's requestLeave() when leaving via app.leaveRoom())
    if (battle.calcdexDestroyed) {
      l.debug('Subscription ignored cause the Calcdex battleState has already been destroyed');

      return;
    }

    if (!battle?.id) {
      l.warn('No active battle found; ignoring Calcdex bootstrap...');

      return;
    }

    // override each player's addPokemon() method to assign a calcdexId lol
    (['p1', 'p2', 'p3', 'p4'] as Showdown.SideID[]).forEach((playerKey) => {
      if (!(playerKey in battle) || battle[playerKey]?.calcdexProcessed || typeof battle[playerKey]?.addPokemon !== 'function') {
        return;
      }

      l.debug('Overriding addPokemon() of player', playerKey);

      const side = battle[playerKey];
      const addPokemon = side.addPokemon.bind(side) as Showdown.Side['addPokemon'];

      side.addPokemon = (name, ident, details, replaceSlot) => {
        const oldPokemon = replaceSlot > -1 ? side.pokemon[replaceSlot] : null;
        const newPokemon = addPokemon(name, ident, details, replaceSlot);

        if (oldPokemon?.calcdexId) {
          newPokemon.calcdexId = oldPokemon.calcdexId;
        }

        return newPokemon;
      };

      side.calcdexProcessed = true;
    });

    // since this is inside a function, we need to grab a fresher snapshot of the Redux state
    const currentState = store.getState();

    // don't use calcdexSettings here cause it may be stale
    const settings = (currentState.showdex as ShowdexSliceState)?.settings?.calcdex;
    const battleState = (currentState.calcdex as CalcdexSliceState)?.[battle.id];

    // make sure the battle was active on the previous sync, but now has ended
    const battleEnded = battle.ended
      || battleRoom.battleEnded
      || battleRoom.expired;

    if (battleState?.active && battleEnded) {
      const calcdexRoomId = battle.calcdexRoom?.id
        || getCalcdexRoomId(roomid);

      l.debug(
        'Battle ended; updating active state...',
        '\n', 'calcdexRoomId', calcdexRoomId,
        '\n', 'battle.id', battle.id,
        '\n', 'battle', battle,
      );

      store.dispatch(calcdexSlice.actions.update({
        battleId: battle.id,
        battleNonce: battle.nonce,
        active: false,
      }));

      if (settings?.closeOnEnd && calcdexRoomId && calcdexRoomId in app.rooms) {
        l.debug(
          'Leaving calcdexRoom due to user settings...',
          '\n', 'calcdexRoomId', calcdexRoomId,
          '\n', 'battle.id', battle.id,
          '\n', 'battle', battle,
        );

        // sets battle.calcdexDestroyed to true and
        // removes the calcdexRoom & calcdexReactRoot properties
        app.leaveRoom(calcdexRoomId);
      }

      // if (settings.destroyOnClose) {
      //   delete battle.calcdexRoom;
      //   delete battle.calcdexReactRoot;
      // }

      return;
    }

    battle.nonce = calcBattleCalcdexNonce(battle);

    if (!battle.calcdexReactRoot) {
      return;
    }

    l.debug(
      'Rendering Calcdex with battle nonce', battle.nonce,
      // '\n', 'store.getState()', store.getState(),
    );

    // battle.calcdexReactRoot.render((
    //   <ReduxProvider store={store}>
    //     <ErrorBoundary
    //       component={CalcdexError}
    //       battleId={battle?.id}
    //     >
    //       <Calcdex
    //         battle={battle}
    //         // tooltips={tooltips}
    //       />
    //     </ErrorBoundary>
    //   </ReduxProvider>
    // ));

    renderCalcdex(battle.calcdexReactRoot, store, battle);
  });

  battle.subscriptionDirty = true;
};
