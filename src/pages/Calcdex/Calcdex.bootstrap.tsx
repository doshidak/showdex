import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { Provider as ReduxProvider } from 'react-redux';
import { ColorSchemeProvider } from '@showdex/components/app';
import {
  createSideRoom,
  // getActiveBattle,
  getBattleRoom,
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

      // const activeBattle = getActiveBattle();
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
        const calcdexRoomId = `view-calcdex-${roomid}`;

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
