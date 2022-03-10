import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  createSideRoom,
  // getActiveBattle,
  getBattleRoom,
} from '@showdex/utils/app';
import { logger } from '@showdex/utils/debug';
import { calcBattleCalcdexNonce } from './calcCalcdexNonce';
import { Calcdex } from './Calcdex';

const l = logger('Calcdex.bootstrap');

export const bootstrap = (roomid?: string): void => {
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
    tooltips,
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
      'must have some jank battle object cause battle.subscribe() is apparently type',
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
      '\n', 'about to inject some real filth into battle.subscribe()...',
      '\n', 'subscriptionDirty', subscriptionDirty,
    );

    if (typeof subscription === 'function' && typeof prevSubscription !== 'function') {
      l.debug('remapping original subscription() function to prevSubscription()');

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
          '\n', 'calling the original battle.subscribe() function...',
        );

        battle.prevSubscription(state);
      }

      if (state === 'paused') {
        l.debug(
          'battle.subscribe()',
          '\n', 'subscription ignored cause the battle is paused or, probs more likely, ended',
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
          '\n', 'no active battle found; ignoring Calcdex bootstrap...',
        );

        return;
      }

      if (!activeBattle.calcdexRoom) {
        const calcdexRoomId = `view-calcdex-${roomid}`;

        l.debug(
          'battle.subscribe() -> createSideRoom()',
          '\n', 'creating a side-room for Calcdex since battle.calcdexRoom is falsy...',
          '\n', 'id', calcdexRoomId,
          '\n', 'title', 'Calcdex',
        );

        activeBattle.calcdexRoom = createSideRoom(
          calcdexRoomId,
          'Calcdex',
          true,
        );
      }

      activeBattle.nonce = calcBattleCalcdexNonce(activeBattle);

      l.debug(
        'battle.subscribe() -> ReactDOM.render()',
        '\n', 'rendering Calcdex with battle nonce', activeBattle.nonce,
      );

      ReactDOM.render((
        <Calcdex
          battle={activeBattle}
          tooltips={tooltips}
        />
      ), battle.calcdexRoom.el);
    });

    battle.subscriptionDirty = true;
  } else {
    battle.subscription?.('callback');
  }
};
