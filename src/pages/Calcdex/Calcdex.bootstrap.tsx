import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { Provider as ReduxProvider } from 'react-redux';
import { ColorSchemeProvider } from '@showdex/components/app';
import {
  createSideRoom,
  // getActiveBattle,
  getBattleRoom,
  getCalcdexRoomId,
} from '@showdex/utils/app';
import { calcBattleCalcdexNonce } from '@showdex/utils/calc';
import { logger } from '@showdex/utils/debug';
import type { ShowdexBootstrapper } from '@showdex/main';
import { Calcdex } from './Calcdex';

const l = logger('@showdex/pages/Calcdex/Calcdex.bootstrap');

export const calcdexBootstrapper: ShowdexBootstrapper = (
  store,
  roomid,
) => {
  l.debug(
    'Calcdex bootstrapper was invoked;',
    'determining if there\'s anything to do...',
  );

  if (!roomid?.startsWith?.('battle-')) {
    l.debug(
      'Calcdex bootstrap request was ignored for roomid', roomid,
      'since it\'s not a BattleRoom',
    );

    return;
  }

  // const {
  //   battle,
  //   tooltips,
  // } = app.curRoom as BattleRoom;

  const {
    battle,
    // tooltips,
  } = getBattleRoom(roomid);

  if (!battle?.id) {
    l.debug(
      'Calcdex bootstrap request was ignored for roomid', roomid,
      'since no proper battle object exists within the current BattleRoom',
    );

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
  } = battle || { subscription: null };

  if (!subscriptionDirty) {
    l.debug(
      'battle\'s subscription isn\'t dirty yet!',
      '\n', 'About to inject some real filth into battle.subscribe()...',
      '\n', 'subscriptionDirty', subscriptionDirty,
    );

    if (typeof subscription === 'function' && typeof prevSubscription !== 'function') {
      l.debug('Remapping original subscription() function to prevSubscription()');

      battle.prevSubscription = subscription.bind(battle) as typeof subscription;
    }

    // note: battle.subscribe() internally sets its `subscription` property to the `listener` arg
    // (in js/battle.js) battle.subscribe = function (listener) { this.subscription = listener; };
    battle.subscribe((state) => {
      l.debug(
        'battle.subscribe()',
        '\n', 'state', state,
      );

      if (typeof battle.prevSubscription === 'function') {
        l.debug(
          'battle.subscribe()',
          '\n', 'Calling the original battle.subscribe() function...',
        );

        battle.prevSubscription(state);
      }

      if (state === 'paused') {
        l.debug(
          'battle.subscribe()',
          '\n', 'Subscription ignored cause the battle is paused or, probs more likely, ended',
        );

        return;
      }

      const { battle: activeBattle } = getBattleRoom(roomid);

      l.debug(
        'battle.subscribe() <- getBattleRoom()',
        '\n', 'roomid', roomid,
        '\n', 'activeBattle', activeBattle,
      );

      if (!activeBattle) {
        l.warn(
          'battle.subscribe()',
          '\n', 'No active battle found; ignoring Calcdex bootstrap...',
        );

        return;
      }

      if (!activeBattle.calcdexRoom) {
        const calcdexRoomId = getCalcdexRoomId(roomid);

        l.debug(
          'battle.subscribe() -> createSideRoom()',
          '\n', 'Creating a side-room for Calcdex since battle.calcdexRoom is falsy...',
          '\n', 'id', calcdexRoomId,
          '\n', 'title', 'Calcdex',
        );

        activeBattle.calcdexRoom = createSideRoom(calcdexRoomId, 'Calcdex', {
          icon: 'calculator',
          focus: true,
        });

        activeBattle.calcdexRoom.requestLeave = () => {
          // hide the tab (tabHidden is used to ignore tab renders in the overwritten app.topbar.renderRoomTab() in main)
          $(`a[href*='/${calcdexRoomId}']`).parent().css('display', 'none');
          activeBattle.calcdexRoom.tabHidden = true;

          // find the side room before the calcdexRoom to focus
          // (the trailing dash ['-'] is important in 'battle-' cause the BattlesRoom has id 'battles')
          const roomIds = Object.keys(app.rooms || {}).filter((id) => !!id && !id.startsWith('battle-'));
          const currentRoomId = app.curSideRoom?.id;
          // const calcdexRoomIndex = roomIds.findIndex((id) => id === calcdexRoomId);

          const prevRoomId = roomIds
            // .slice(0, Math.max(calcdexRoomIndex - 1, 0))
            .filter((id) => !('tabHidden' in app.rooms[id]) || !(app.rooms[id] as HtmlRoom).tabHidden)
            .pop();

          // currentRoomId is tracked so that we don't focus to another room when this blurred Calcdex tab is "closed"
          // (i.e., only focus a room if the user "closes" the currenly focused Calcdex room)
          if (prevRoomId && calcdexRoomId !== prevRoomId && (!currentRoomId || calcdexRoomId === currentRoomId)) {
            app.focusRoomRight(prevRoomId);
          } else if (!prevRoomId) {
            activeBattle.calcdexRoom.hide();
          }

          // don't actually leave the room
          return false;
        };

        activeBattle.reactCalcdexRoom = ReactDOM.createRoot(activeBattle.calcdexRoom.el);
      }

      activeBattle.nonce = calcBattleCalcdexNonce(activeBattle);

      l.debug(
        'battle.subscribe() -> activeBattle.reactCalcdexRoom.render()',
        '\n', 'Rendering Calcdex with battle nonce', activeBattle.nonce,
        '\n', 'store.getState()', store.getState(),
      );

      activeBattle.reactCalcdexRoom.render((
        <ReduxProvider store={store}>
          <ColorSchemeProvider>
            <Calcdex
              battle={activeBattle}
              // tooltips={tooltips}
            />
          </ColorSchemeProvider>
        </ReduxProvider>
      ));
    });

    battle.subscriptionDirty = true;
  }
};
