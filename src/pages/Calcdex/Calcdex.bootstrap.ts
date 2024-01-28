import * as ReactDOM from 'react-dom/client';
import { NIL as NIL_UUID } from 'uuid';
import { type GenerationNum } from '@smogon/calc';
import { type ShowdexBootstrapper } from '@showdex/interfaces/app';
import {
  type CalcdexPlayer,
  type CalcdexPlayerKey,
  type CalcdexPokemon,
  CalcdexPlayerKeys as AllPlayerKeys,
} from '@showdex/interfaces/calc';
import { syncBattle } from '@showdex/redux/actions';
import {
  type CalcdexSliceState,
  type RootStore,
  type ShowdexSliceState,
  calcdexSlice,
  hellodexSlice,
} from '@showdex/redux/store';
import { createCalcdexRoom, getCalcdexRoomId, tRef } from '@showdex/utils/app';
import {
  clonePlayerSideConditions,
  detectAuthPlayerKeyFromBattle,
  sanitizePlayerSide,
  similarPokemon,
  usedDynamax,
  usedTerastallization,
} from '@showdex/utils/battle';
import { calcBattleCalcdexNonce } from '@showdex/utils/calc';
import { logger, runtimer } from '@showdex/utils/debug';
import { detectGenFromFormat } from '@showdex/utils/dex';
import { getAuthUsername, getBattleRoom, hasSinglePanel } from '@showdex/utils/host';
import { CalcdexRenderer } from './Calcdex.renderer';
import styles from './Calcdex.module.scss';

/**
 * Object containing the function's `name` and its binded `native` function.
 *
 * * Probably could've been typed better, but not trying to wrangle TypeScript rn lol.
 *
 * @since 1.0.3
 */
export interface BattleRoomOverride<
  TFunc extends (...args: unknown[]) => unknown = (...args: unknown[]) => unknown,
> {
  name: FunctionPropertyNames<Showdown.BattleRoom>;
  native: TFunc;
}

/**
 * Determines if the auth user has won/loss, then increments the win/loss counter.
 *
 * * Specify the `forceResult` argument when you know the `battle` object might not be available.
 *   - `battle` wouldn't be typically available in a `ForfeitPopup`, for instance.
 *
 * @todo Refactor this into a Redux actionator like `syncBattle()`.
 * @since 1.0.6
 */
const updateBattleRecord = (
  store: RootStore,
  battle: Showdown.Battle,
  forceResult?: 'win' | 'loss',
): void => {
  const authUser = getAuthUsername()
    || (store.getState()?.showdex as ShowdexSliceState)?.authUsername;

  if (!authUser || (!battle?.id && !forceResult) || typeof store?.dispatch !== 'function') {
    return;
  }

  const playerNames = [
    battle?.p1?.name,
    battle?.p2?.name,
    battle?.p3?.name,
    battle?.p4?.name,
  ].filter(Boolean);

  const winStep = battle?.stepQueue?.find((s) => s?.startsWith('|win|'));
  const winUser = winStep?.replace?.('|win|', ''); // e.g., '|win|sumfuk' -> 'sumfuk'

  // don't update if we couldn't find the "win" step queue or a forced result wasn't provided
  if ((playerNames.length && !playerNames.includes(authUser)) || (!winUser && !forceResult)) {
    return;
  }

  const didWin = forceResult === 'win' || winUser === authUser;
  const reducerName = didWin ? 'recordWin' : 'recordLoss';

  store.dispatch(hellodexSlice.actions[reducerName]());
};

const l = logger('@showdex/pages/Calcdex/CalcdexBootstrapper()');

export const CalcdexBootstrapper: ShowdexBootstrapper = (
  store,
  data,
  roomid,
) => {
  const endTimer = runtimer(l.scope, l);

  l.silly(
    'Calcdex bootstrapper was invoked;',
    'determining if there\'s anything to do...',
    '\n', 'roomid', roomid,
  );

  if (!roomid?.startsWith?.('battle-')) {
    l.debug(
      'Calcdex bootstrap request was ignored for roomid', roomid,
      'since it\'s not a BattleRoom',
    );

    return endTimer('(wrong room)');
  }

  const battleRoom = getBattleRoom(roomid);

  const {
    $el,
    $chatFrame,
    $controls,
    $userList,
    battle,
  } = battleRoom;

  if (!battle?.id) {
    const state = store.getState()?.calcdex as CalcdexSliceState;

    // we'd typically reach this point when the user forfeits through the popup
    if (!(roomid in (state || {}))) {
      l.debug(
        'Calcdex bootstrap request was ignored for roomid', roomid,
        'since no proper battle object exists within the current BattleRoom',
      );

      return endTimer('(no battle)');
    }

    const battleState = state[roomid];

    if (battleState?.active) {
      store.dispatch(calcdexSlice.actions.update({
        scope: l.scope,
        battleId: roomid,
        active: false,
      }));
    }

    const settings = (store.getState()?.showdex as ShowdexSliceState)?.settings?.calcdex;
    const calcdexRoomId = getCalcdexRoomId(roomid);

    // l.debug(
    //   '\n', 'settings.closeOn', settings?.closeOn,
    //   '\n', 'battleState.renderMode', battleState.renderMode,
    //   '\n', 'calcdexRoomId', calcdexRoomId,
    //   '\n', 'calcdexRoomId in app.rooms?', calcdexRoomId in app.rooms,
    // );

    // this would only apply in the tabbed panel mode, obviously
    if (battleState.renderMode === 'panel' && settings?.closeOn !== 'never' && calcdexRoomId in app.rooms) {
      l.debug(
        'Leaving calcdexRoom with destroyed battle due to user settings...',
        '\n', 'calcdexRoomId', calcdexRoomId,
      );

      // this will destroy the Calcdex state if configured to, via calcdexRoom's requestLeave() handler
      app.leaveRoom(calcdexRoomId);

      // update (2023/02/04): did I forget a return here? ...probably cause it keeps triggering the return from
      // the typeof battle?.subscribe check
      return endTimer('(calcdex destroyed)');
    }

    l.debug(
      'Calcdex for roomid', roomid, 'exists in state, but battle was forcibly ended, probably.',
      '\n', 'battleRoom', battleRoom,
      '\n', 'battleState', battleState,
    );

    // update (2023/02/04): might as well put a return here too since this is part of the !battle?.id handler
    return endTimer('(battle destroyed)');
  }

  // update (2023/07/27): check for '|noinit|' or '|nonexistent|' in the `data` & if present, ignore initializing this battle,
  // e.g., '|noinit|nonexistent|The room "battle-gen1ubers-1911645170-ygxif0uoljetvrkksj6dcge3w43xx8wpw" does not exist.'
  // (typically occurs when you AFK in a BattleRoom, your computer sleeps, you come back later & select "Reconnect", refreshing the page)
  // note that we're not checking the stepQueue since it could be uninitialized/empty at this point, so we just wanna read what the client
  // received from the server in this moment (which is formatted as a single stepQueue entry in `data`)
  const stepFromData = data?.split?.('\n')[1];
  const shouldNotInit = stepFromData?.startsWith('|noinit|nonexistent|')
    // these last 2 checks may backfire on me lmao
    && stepFromData.includes('The room "')
    && stepFromData.endsWith('" does not exist.');

  if (shouldNotInit) {
    l.debug(
      'Calcdex bootstrapper request was ignored for roomid', roomid,
      'since the battle is marked as nonexistent & shouldn\'t be initialized',
      '\n', 'stepFromData', stepFromData,
    );

    return endTimer('(noinit battle)');
  }

  if (typeof battle?.subscribe !== 'function') {
    l.warn(
      'Must have some jank battle object cause battle.subscribe() is apparently type',
      typeof battle?.subscribe,
    );

    return endTimer('(bad battle)');
  }

  const {
    calcdexInit,
    // subscription,
    // prevSubscription,
    // subscriptionDirty,
  } = battle;

  // don't process this battle if we've already added (or forcibly prevented) the filth
  if (calcdexInit) {
    return endTimer('(already filthy)');
  }

  // delaying initialization if the battle hasn't instantiated all the players yet
  // (which we can quickly determine by the existence of '|player|' steps in the stepQueue)
  if (!battle.stepQueue?.length || !battle.stepQueue.some((q) => q?.startsWith('|player|'))) {
    l.debug(
      'Ignoring Calcdex init due to uninitialized players in battle',
      '\n', 'stepQueue', battle.stepQueue,
      '\n', 'battleId', battle.id || roomid,
      '\n', 'battle', battle,
    );

    return endTimer('(uninit players)');
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
      return endTimer('(calcdex denied)');
    }
  }

  // update (2023/02/01): used to be in the battle object as calcdexReactRoot, but post-refactor, we no longer
  // need to keep a reference in the battle object (Hellodex will create a new root via ReactDOM.createRoot() btw)
  // update (2023/04/22): jk, we need a reference to it now in order to call calcdexReactRoot.unmount() --
  // just in the debug logs that the React roots of already closed battles (in the same session) are still mounted!
  // the ReactDOM.Root will be stored in battle.calcdexRoom.reactRoot for panel tabs & (rather confusingly)
  // battle.calcdexReactRoot for battle overlays (potentially could rename it to calcdexOverlayReactRoot... LOL)
  // let calcdexReactRoot: ReactDOM.Root;

  const openAsPanel = !calcdexSettings?.openAs
    || calcdexSettings.openAs === 'panel'
    || (calcdexSettings.openAs === 'showdown' && !hasSinglePanel());

  if (openAsPanel) {
    // create the calcdexRoom if it doesn't already exist (shouldn't tho)
    // update (2023/04/22): createCalcdexRoom() will also create a ReactDOM.Root under reactRoot
    if (!battle.calcdexRoom) {
      battle.calcdexRoom = createCalcdexRoom(roomid, store, true);
    }

    // handle destroying the Calcdex when leaving the battleRoom
    const requestLeave = battleRoom.requestLeave.bind(battleRoom) as typeof battleRoom.requestLeave;

    battleRoom.requestLeave = (e) => {
      const shouldLeave = requestLeave(e);

      // ForfeitPopup probably appeared
      if (!shouldLeave) {
        // similar to the battle overlay, we'll override the submit() handler of the ForfeitPopup
        const forfeitPopup = app.popups.find((p) => (p as Showdown.ForfeitPopup).room === battleRoom);

        if (typeof forfeitPopup?.submit === 'function') {
          l.debug(
            'Overriding submit() of spawned ForfeitPopup in app.popups[]...',
            '\n', 'battleId', roomid,
          );

          const submitForfeit = forfeitPopup.submit.bind(forfeitPopup) as typeof forfeitPopup.submit;

          // unlike the battle overlay, we'll only close if configured to (and destroy if closing the room)
          forfeitPopup.submit = (...args) => {
            const calcdexRoomId = getCalcdexRoomId(roomid);

            // grab the current settings
            const settings = (store.getState()?.showdex as ShowdexSliceState)?.settings?.calcdex;

            if (settings?.closeOn !== 'never' && calcdexRoomId && calcdexRoomId in (app.rooms || {})) {
              // this will trigger calcdexRoom's requestLeave() handler,
              // which may destroy the state depending on the user's settings
              app.leaveRoom(calcdexRoomId);
            }

            updateBattleRecord(store, battleRoom?.battle, 'loss');

            // call ForfeitPopup's original submit() handler
            submitForfeit(...args);
          };
        }

        // don't actually leave the room, as requested by requestLeave()
        return false;
      }

      // actually leave the room
      return true;
    };
  } else { // must be opening as an overlay here
    // local helper function that will be called once the native BattleRoom controls
    // are rendered in the `overrides` below
    // (warning: most of this logic is from trial and error tbh -- may make very little sense LOL)
    const injectToggleButton = () => {
      if (typeof $controls?.find !== 'function') {
        return;
      }

      // grab the latest overlayVisible value
      const state = (store.getState()?.calcdex as CalcdexSliceState)?.[battle.id || roomid];
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
    ] as FunctionPropertyNames<Showdown.BattleRoom>[]).map((name) => ({
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
      (battleRoom as unknown as Record<FunctionPropertyNames<Showdown.BattleRoom>, (...args: unknown[]) => void>)[name] = (
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
      // battle.calcdexOverlayVisible = !battle.calcdexOverlayVisible;

      const state = (store.getState()?.calcdex as CalcdexSliceState)?.[battle.id || roomid];
      const visible = !state?.overlayVisible;

      store.dispatch(calcdexSlice.actions.update({
        scope: `${l.scope}:battleRoom.toggleCalcdexOverlay()`,
        battleId: battle.id || roomid,
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
      // Battle Overlay... and it was very inconsistent... LOL
      // (shoutout to SpiffyTheSpaceman for helping me debug this in < 5 minutes while blasted af)
      // also note that $chatbox comes and goes, so sometimes it's null, hence the check
      if (battleRoom.$chatbox?.length) {
        battleRoom.$chatbox.prop('disabled', visible);
      }

      // found another one lol (typically in spectator mode)
      if (battleRoom.$chatAdd?.length) {
        const $joinButton = battleRoom.$chatAdd.find('button');

        if ($joinButton.length) {
          $joinButton.prop('disabled', visible);
        }
      }

      // for mobile (no effect on desktops), prevent pinch zooming and zooming on input focus
      if (visible) {
        const $existingMeta = $('meta[data-calcdex*="no-mobile-zoom"]');

        if ($existingMeta.length) {
          $existingMeta.attr('content', 'width=device-width, initial-scale=1, maximum-scale=1');
        } else {
          $('head').append(`
            <meta
              data-calcdex="no-mobile-zoom"
              name="viewport"
              content="width=device-width, initial-scale=1, maximum-scale=1"
            />
          `);
        }
      } else {
        // allow pinch zooming again once the Calcdex is closed
        // (warning: not enough to just remove the meta tag as the browser will continue to enforce the no pinch zoom!)
        $('meta[data-calcdex*="no-mobile-zoom"]').attr('content', 'width=device-width, user-scalable=yes');
      }

      // most BattleRoom button callbacks seem to do this at the end lol
      battleRoom.updateControls();
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

      // ForfeitPopup probably appeared
      if (!shouldLeave) {
        // attempt to find the ForfeitPopup to override its submit() callback to destroy the Calcdex
        // (otherwise, the state will remain in the Hellodex since the battleRoom's overrides didn't fire)
        const forfeitPopup = app.popups.find((p) => (p as Showdown.ForfeitPopup).room === battleRoom);

        if (typeof forfeitPopup?.submit === 'function') {
          l.debug(
            'Overriding submit() of spawned ForfeitPopup in app.popups[]...',
            '\n', 'battleId', roomid,
          );

          const submitForfeit = forfeitPopup.submit.bind(forfeitPopup) as typeof forfeitPopup.submit;

          forfeitPopup.submit = (...args) => {
            // clean up allocated memory from React & Redux for this Calcdex instance
            battle?.calcdexReactRoot?.unmount?.();
            store.dispatch(calcdexSlice.actions.destroy(roomid));

            // update the Hellodex W/L battle record
            updateBattleRecord(store, battleRoom?.battle, 'loss');

            // call the original function
            submitForfeit(...args);
          };
        }

        // don't actually leave the room, as requested by requestLeave()
        return false;
      }

      const battleId = battle?.id || roomid;

      if (battleId) {
        store.dispatch(calcdexSlice.actions.destroy(battleId));

        if (battle?.id) {
          battle.calcdexReactRoot?.unmount?.();
          battle.calcdexDestroyed = true;
        }
      }

      // actually leave the room
      return true;
    };
  }

  // override each player's addPokemon() method to assign a calcdexId lol
  AllPlayerKeys.forEach((playerKey) => {
    if (!(playerKey in battle) || typeof battle[playerKey]?.addPokemon !== 'function') {
      return;
    }

    l.debug(
      'Overriding side.addPokemon() of player', playerKey,
      '\n', 'battleId', roomid,
    );

    const side = battle[playerKey];
    const addPokemon = side.addPokemon.bind(side) as Showdown.Side['addPokemon'];

    side.addPokemon = (name, ident, details, replaceSlot) => {
      // we'll collect potential candidates to assemble the final search list below
      const pokemonSearchCandidates: (Showdown.Pokemon | CalcdexPokemon)[] = [];

      // make sure this comes first before `pokemonState` in case `replaceSlot` is specified
      if (side.pokemon?.length) {
        pokemonSearchCandidates.push(...side.pokemon);
      }

      // retrieve any previously tagged Pokemon in the state if we don't have any candidates atm
      const battleState = (store.getState()?.calcdex as CalcdexSliceState)?.[battle?.id];

      // update (2024/01/03): someone encountered a strange case in Gen 9 VGC 2024 Reg F when after using Parting Shot,
      // accessing battleState.format in the similarPokemon() call below would result in a TypeError, causing their
      // Showdown to break (spitting the runMajor() stack trace into the BattleRoom chat)... which means battleState was
      // undefined for some reason o_O (apparently this doesn't happen often tho)
      if (!battleState?.battleId) {
        // we'll just let the client deal with whatever this is
        return addPokemon(name, ident, details, replaceSlot);
      }

      const pokemonState = battleState?.[playerKey]?.pokemon || [];

      if (pokemonState.length) {
        pokemonSearchCandidates.push(...pokemonState);
      }

      // don't filter this in case `replaceSlot` is specified
      const pokemonSearchList = pokemonSearchCandidates.map((p) => ({
        calcdexId: p.calcdexId,
        ident: p.ident,
        // name: p.name,
        speciesForme: p.speciesForme,
        gender: p.gender,
        details: p.details,
        searchid: p.searchid,
      }));

      // just js things uwu
      const prevPokemon = (replaceSlot > -1 && pokemonSearchList[replaceSlot])
        || pokemonSearchList.filter((p) => !!p.calcdexId).find((p) => (
          // e.g., ident = 'p1: CalcdexDemolisher' (nicknamed) or 'p1: Ditto' (unnamed default)
          // update (2023/07/30): while `ident` is mostly available, when viewing a replay (i.e., an old saved battle), it's not!
          (!ident || (
            (!!p?.ident && p.ident === ident)
              // e.g., searchid = 'p1: CalcdexDemolisher|Ditto'
              // nickname case: pass; default case: fail ('p1: CalcdexDemolisher' !== 'p1: Ditto')
              // note: not doing startsWith() since 'p1: Mewtwo|Mewtwo' will pass when given ident 'p1: Mew'
              || (!!p?.searchid?.includes('|') && p.searchid.split('|')[0] === ident)
          ))
            && similarPokemon({ details }, p, {
              format: battleState.format,
              normalizeFormes: 'wildcard',
              ignoreMega: true,
            })
        ));

      // l.debug(
      //   'side.addPokemon()', 'for', ident || name || details?.split(',')?.[0], 'for player', side.sideid,
      //   '\n', 'ident', ident,
      //   '\n', 'details', details,
      //   '\n', 'replaceSlot', replaceSlot,
      //   '\n', 'prevPokemon', prevPokemon,
      //   '\n', 'pokemonSearchList', pokemonSearchList,
      //   // '\n', 'side', side,
      //   // '\n', 'battle', battle,
      // );

      const newPokemon = addPokemon(name, ident, details, replaceSlot);

      if (prevPokemon?.calcdexId) {
        newPokemon.calcdexId = prevPokemon.calcdexId;

        l.debug(
          'Restored calcdexId', newPokemon.calcdexId,
          'from prevPokemon', prevPokemon.ident || prevPokemon.speciesForme,
          'to newPokemon', newPokemon.ident || newPokemon.speciesForme,
          'for player', side.sideid,
          '\n', 'prevPokemon', prevPokemon,
          '\n', 'newPokemon', newPokemon,
        );
      }

      return newPokemon;
    };
  });

  l.debug(
    'Overriding updateSide() of the current battleRoom',
    '\n', 'battleId', roomid,
  );

  const updateSide = battleRoom.updateSide.bind(battleRoom) as typeof battleRoom.updateSide;

  battleRoom.updateSide = () => {
    // grab a copy of myPokemon before updateSide() unleashes valhalla on it
    const myPokemon = [...(battleRoom.battle?.myPokemon || [])];

    // now run the original function, which will directly mutate myPokemon from
    // battleRoom.requests.side.pokemon
    updateSide();

    // l.debug(
    //   'updateSide()',
    //   '\n', 'battleId', roomid,
    //   '\n', 'myPokemon', '(prev)', myPokemon, '(now)', battleRoom.battle.myPokemon,
    // );

    let didUpdate = !myPokemon?.length
      && !!battleRoom.battle.myPokemon?.length;

    // with each updated myPokemon, see if we find a match to restore its calcdexId
    battleRoom.battle.myPokemon.forEach((pokemon) => {
      if (!pokemon?.ident || pokemon.calcdexId) {
        return;
      }

      // note (2023/07/30): leave the `ident` check as is here since viewing a replay wouldn't trigger this function
      // (there are no myPokemon when viewing a replay, even if you were viewing your own battle!)
      const prevMyPokemon = myPokemon.find((p) => !!p?.ident && (
        p.ident === pokemon.ident
          || p.speciesForme === pokemon.speciesForme
          || p.details === pokemon.details
          // update (2023/07/27): this check breaks when p.details is 'Mewtwo' & pokemon.speciesForme is 'Mew',
          // resulting in the Mewtwo's calcdexId being assigned to the Mew o_O
          // || p.details.includes(pokemon.speciesForme)
          // update (2023/07/30): `details` can include the gender, if applicable (e.g., 'Reuniclus, M')
          /*
          || p.details === [
            pokemon.speciesForme.replace('-*', ''),
            pokemon.gender !== 'N' && pokemon.gender,
          ].filter(Boolean).join(', ')
          */
          || similarPokemon(pokemon, p, {
            format: battleRoom.battle.id.split('-').find((part) => detectGenFromFormat(part)),
            normalizeFormes: 'wildcard',
            ignoreMega: true,
          })
      ));

      if (!prevMyPokemon?.calcdexId) {
        return;
      }

      pokemon.calcdexId = prevMyPokemon.calcdexId;
      didUpdate = true;

      // l.debug(
      //   'Restored previous calcdexId for', pokemon.speciesForme, 'in battle.myPokemon[]',
      //   '\n', 'calcdexId', prevMyPokemon.calcdexId,
      //   '\n', 'pokemon', '(prev)', prevMyPokemon, '(now)', pokemon,
      // );
    });

    if (didUpdate && battleRoom.battle.calcdexInit) {
      // const prevNonce = battleRoom.battle.nonce;

      battleRoom.battle.nonce = calcBattleCalcdexNonce(battleRoom.battle, battleRoom.request);

      // l.debug(
      //   'Restored previous calcdexId\'s in battle.myPokemon[]',
      //   '\n', 'nonce', '(prev)', prevNonce, '(now)', battleRoom.battle.nonce,
      //   '\n', 'myPokemon', '(prev)', myPokemon, '(now)', battleRoom.battle.myPokemon,
      // );

      // since myPokemon could be available now, forcibly fire a battle sync
      // (should we check if myPokemon is actually populated? maybe... but I'll leave it like this for now)
      battleRoom.battle.subscription('callback');
    }
  };

  l.debug(
    // 'battle\'s subscription() isn\'t dirty yet!',
    'About to inject some real filth into battle.subscribe()...',
    '\n', 'battleId', roomid,
    '\n', 'typeof battle.subscription', typeof battle.subscription,
    '\n', 'battle', battle,
  );

  const prevSubscription = battle.subscription?.bind?.(battle) as typeof battle.subscription;

  // note: battle.subscribe() internally sets its `subscription` property to the `listener` arg
  // (in js/battle.js) battle.subscribe = function (listener) { this.subscription = listener; };
  battle.subscribe((state) => {
    l.debug(
      'battle.subscribe() for', battle?.id || roomid,
      '\n', 'state', state,
      '\n', 'battle', battle,
    );

    // call the original subscription() first, if any, so we don't break anything we don't mean to!
    prevSubscription?.(state);

    // update (2022/10/13): allowing paused battle states to trigger a re-render
    // if (state === 'paused') {
    //   l.debug(
    //     'Subscription ignored cause the battle is paused or, probs more likely, ended',
    //     '\n', 'battleId', roomid,
    //   );
    //
    //   return;
    // }

    // don't render if we've already destroyed the battleState
    // (via calcdexRoom's requestLeave() when leaving via app.leaveRoom())
    if (battle.calcdexDestroyed) {
      l.debug(
        'Calcdex battleState has been destroyed',
        '\n', 'battleId', roomid,
      );

      return;
    }

    if (!battle?.id) {
      l.debug(
        'No valid battle object was found',
        '\n', 'battleId', roomid,
      );

      return;
    }

    if (battle.id !== roomid) {
      l.debug(
        'Current battle update is not for this battleRoom',
        '\n', 'battleId', '(init)', roomid, '(recv)', battle.id,
      );

      return;
    }

    // ignore any freshly created battle objects with missing players
    if (!battle.p1?.id || AllPlayerKeys.slice(1).every((k) => !battle[k]?.id)) {
      l.debug(
        'Not all players exist yet in the battle!',
        '\n', 'players', AllPlayerKeys.map((k) => battle[k]?.id),
        '\n', 'stepQueue', battle.stepQueue,
        '\n', 'battleId', battle.id || roomid,
      );

      return;
    }

    if (!battle.calcdexStateInit) {
      // dispatch a Calcdex state initialization to Redux
      // (moved this out from CalcdexProvider, where React originally dispatched init/sync in early versions before Redux)
      const authUser = getAuthUsername()
        || (store.getState()?.showdex as ShowdexSliceState)?.authUsername;

      // note: using NIL_UUID as the initial nonce here since the init state could be ready by the time the nonce
      // check for syncing executes (if we used the actual nonce, the check would fail since they'd be the same!)
      // const initNonce = calcBattleCalcdexNonce(battle, battleRoom.request);
      const initNonce = NIL_UUID; // i.e., NIL_UUID = '00000000-0000-0000-0000-000000000000'

      l.debug(
        'Initializing Calcdex state for', battle.id || roomid,
        '\n', 'nonce', '(init)', initNonce,
        '\n', 'battle', battle,
      );

      store.dispatch(calcdexSlice.actions.init({
        scope: `${l.scope}:battle.subscribe()`,

        operatingMode: 'battle',
        battleId: battle.id || roomid,
        battleNonce: initNonce,
        gen: battle.gen as GenerationNum,
        // format: battle.id.split('-')?.[1], // update (2024/01/22): on smogtours, it's 'battle-smogtours-gen9ou-...' lmao
        format: battle.id.split('-').find((p) => detectGenFromFormat(p)),
        gameType: battle.gameType === 'doubles' ? 'Doubles' : 'Singles',
        turn: Math.max(battle.turn || 0, 0),
        active: !battle.ended,
        renderMode: openAsPanel ? 'panel' : 'overlay',
        switchPlayers: battle.viewpointSwitched ?? battle.sidesSwitched,

        ...AllPlayerKeys.reduce((prev, playerKey) => {
          const player = battle[playerKey];

          prev[playerKey] = {
            active: !!player?.id,
            name: player?.name || null,
            rating: player?.rating || null,

            autoSelect: calcdexSettings.defaultAutoSelect
              ?.[(!!authUser && player?.name === authUser && 'auth') || playerKey],

            usedMax: usedDynamax(playerKey, battle.stepQueue),
            usedTera: usedTerastallization(playerKey, battle.stepQueue),
          };

          // note: sanitizePlayerSide() needs the updated side.conditions, so we're initializing
          // it like this here first
          prev[playerKey].side = {
            conditions: clonePlayerSideConditions(player?.sideConditions),
          };

          prev[playerKey].side = {
            conditions: prev[playerKey].side.conditions,
            ...sanitizePlayerSide(
              battle.gen as GenerationNum,
              prev[playerKey],
              player,
            ),
          };

          return prev;
        }, {} as Record<CalcdexPlayerKey, CalcdexPlayer>),
      }));

      battle.calcdexStateInit = true;

      // don't continue processing until the next subscription callback
      // update (2023/01/31): nvm, init state could be available on the store.getState() call below,
      // but since we're checking for a battleNonce before syncing, it's ok if it doesn't exist yet either
      // (if a NIL as battleNonce is present, even if NIL_UUID, then we know the state has initialized)
      // update (2023/02/06): now preventing the first battle sync if the logged-in user is also player
      // since myPokemon could be empty here; the callback in the overridden updateSide() should trigger
      // the battle sync once myPokemon is populated; but if we're just spectating here, we can continue
      // syncing after init as normal; also, checking if the battle ended since we could be watching a replay,
      // in which case the authUser check could pass without myPokemon being populated
      if (!battle.ended && AllPlayerKeys.some((k) => battle[k]?.name === authUser)) {
        return;
      }
    }

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
        '\n', 'battleId', battle?.id || roomid,
        '\n', 'calcdexRoomId', calcdexRoomId,
        '\n', 'battle', battle,
      );

      store.dispatch(calcdexSlice.actions.update({
        scope: `${l.scope}:battle.subscribe()`,
        battleId: battle.id || roomid,
        battleNonce: battle.nonce,
        active: false,
      }));

      updateBattleRecord(store, battle);

      // only close the calcdexRoom if configured to
      // (here, it's only on 'battle-end' since we're specifically handling that scenario rn)
      if (settings?.closeOn === 'battle-end' && calcdexRoomId && calcdexRoomId in (app.rooms || {})) {
        l.debug(
          'Leaving calcdexRoom due to user settings...',
          '\n', 'battleId', battle?.id || roomid,
          '\n', 'calcdexRoomId', calcdexRoomId,
          '\n', 'battle', battle,
        );

        // sets battle.calcdexDestroyed to true and `delete`s the calcdexRoom property
        // update (2023/02/01): no longer `delete`s the calcdexReactRoot since it's not stored in the battle anymore
        // update (2023/04/22): overwritten calcdexRoom.requestLeave() handler (invoked by app.leaveRoom())
        // will automatically call calcdexRoom.reactRoot.unmount(); additionally, the battle's calcdexReactRoot is
        // exclusively being used for battle overlays now (as of v1.1.5)
        app.leaveRoom(calcdexRoomId);
      }

      return;
    }

    // note: since we're filtering the subscription callback to avoid UI spamming,
    // we get the value of battleRoom.request right before it updates on the next callback.
    // not a big deal tho, but it's usually first `null`, then becomes populated on the
    // next Calcdex render callback (i.e., here).
    battle.nonce = calcBattleCalcdexNonce(battle, battleRoom.request);

    // this check is to make sure the state has been initialized before attempting to sync
    // update (2023/07/24): ok this is what I get for not using 'strict' mode butt fuck it
    // (it's a good habit to always check your inputs anyways, especially cause things can go wrong during runtime!)
    if (!battleState?.battleNonce) {
      return;
    }

    // dispatch a battle sync if the nonces are different (i.e., something changed)
    if (battle.nonce === battleState.battleNonce) {
      // l.debug(
      //   'Ignoring battle sync due to same nonce for', battle.id || roomid,
      //   '\n', 'nonce', '(prev)', battleState.battleNonce, '(now)', battle.nonce,
      //   '\n', 'battle', battle,
      // );

      return;
    }

    l.debug(
      'Syncing battle for', battle.id || roomid,
      '\n', 'nonce', '(prev)', battleState.battleNonce, '(now)', battle.nonce,
      '\n', 'request', battleRoom.request,
      '\n', 'battle', battle,
      '\n', 'state', '(prev)', battleState,
    );

    // note: syncBattle() is no longer async, but since it's still wrapped in an async thunky,
    // we're keeping the `void` to keep TypeScript happy lol (`void` does nothing here btw)
    void store.dispatch(syncBattle({
      battle,
      request: battleRoom.request,
    }));
  });

  // update (2023/02/01): we're now only rendering the Calcdex once since React is no longer
  // dispatching battle updates (we're dispatching them out here in the bootstrapper).
  // state mutations in Redux should trigger necessary UI re-renders within React.
  // (also probably no longer need to reference the calcdexReactRoot in the battle object now tbh)
  // update (2023/04/22): nope -- we still do! we have to call calcdexReactRoot.unmount(),
  // which obviously won't be available on subsequent bootstrapper invocations as a local var,
  // so... back in the `battle` (for overlays) or `calcdexRoom` (for tabs) you go!
  const calcdexReactRoot = battle.calcdexReactRoot || battle.calcdexRoom?.reactRoot;

  if (calcdexReactRoot) {
    // l.debug(
    //   'Rendering Calcdex for', battle.id || roomid,
    //   // '\n', 'nonce', '(now)', battle.nonce || initNonce,
    //   // '\n', 'request', battleRoom.request,
    //   '\n', 'battle', battle,
    //   '\n', 'battleRoom', battleRoom,
    // );

    CalcdexRenderer(
      calcdexReactRoot,
      store,
      battle.id || roomid,
      battleRoom,
    );

    // force a callback after rendering
    // update (2023/02/04): bad idea, sometimes leads to a half-initialized battle object where there's
    // only one player (which breaks the syncing); downside is that it doesn't appear to the user that the
    // Calcdex is loading that fast, but it loads with the battle frame, so it isn't the worst thing ever
    // update (2023/02/06): now checking if we're already at the queue end, which could happen if you refresh
    // the page mid-battle or join a spectating game; otherwise, the Calcdex won't appear until the players
    // do something (e.g., choose an option, turn on the timer, etc.) that triggers the subscription callback
    if (battle.atQueueEnd) {
      // l.debug(
      //   'Forcing a battle sync via battle.subscription() since the battle is atQueueEnd',
      //   '\n', 'battle.atQueueEnd', battle.atQueueEnd,
      //   '\n', 'battle', battle,
      //   '\n', 'battleRoom', battleRoom,
      // );

      battle.subscription('atqueueend');
    }
  } else {
    l.error(
      'ReactDOM root has not been initialized, despite completing the bootstrap.',
      'Something is horribly wrong here!',
      '\n', 'battleId', battle.id || roomid,
      '\n', 'calcdexReactRoot', '(type)', typeof calcdexReactRoot, '(now)', calcdexReactRoot,
      '\n', 'battle', battle,
      '\n', 'battleRoom', battleRoom,
    );
  }

  battle.calcdexInit = true;

  endTimer('(bootstrap complete)');
};
