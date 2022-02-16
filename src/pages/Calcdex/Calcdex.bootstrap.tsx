import * as React from 'react';
import * as ReactDOM from 'react-dom';
// import { Smogon } from '@pkmn/smogon';
// import { v4 as uuidv4 } from 'uuid';
import { createSideRoom, getActiveBattle } from '@showdex/utils/app';
// import { runtimeFetch } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { calcBattleCalcdexNonce } from './calcCalcdexNonce';
import { Calcdex } from './Calcdex';

// const smogon = new Smogon(runtimeFetch);

const l = logger('Calcdex.bootstrap');

export const bootstrap = (roomId?: string): void => {
  l.debug(
    'Calcdex bootstrapper was invoked;',
    'determining if there\'s anything to do...',
  );

  if (!roomId?.startsWith?.('battle-')) {
    l.debug(
      'Calcdex bootstrap request was ignored for roomId', roomId,
      'since it\'s not a BattleRoom',
    );

    return;
  }

  const {
    battle,
    tooltips,
  } = app.curRoom as BattleRoom;

  if (!battle?.id) {
    l.debug(
      'Calcdex bootstrap request was ignored for roomId', roomId,
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

  if (typeof subscription === 'function') {
    battle.prevSubscription = subscription;
  }

  if (!subscriptionDirty) {
    l.debug(
      'battle object\'s subscription isn\'t dirtied yet;',
      'about to inject some real filth into battle.subscribe()...',
    );

    /**
     * @todo possible `battle` object bug, causing minor desync issues, primarily visual.
     *
     * the `Calcdex` component doesn't seem to update despite the `subscription` being called.
     * sometimes, it receives NO updates from the `battle` prop, other times, it ignores the update
     * due to the same `battle.nonce` value
     * (which is fine, cause otherwise, it may infinitely render in a loop).
     *
     * unsure if the `battle` inside the `subscribe()` function is the same `battle` object
     * from when subscribe() was injected (prior to battle.subscriptionDirty being `true`),
     * or the actual current `battle` object.
     *
     * (but we are retrieving the current `battle` object via `getActiveBattle()`,
     * which does retrieve `battle` from `app.curRoom`.)
     *
     * if `battle` is a reference to itself (i.e., an object pointer),
     * we should be good, theoretically, since there's only 1 actual `battle` object in memory.
     *
     * alternatively, any references to `battle` inside the `subscription` function
     * can refer to the `battle` object inside `app.curRoom`, which may or may not be up-to-date.
     */
    battle.subscribe((state) => {
      l.debug('battle.subscribe() was called with state:', state);

      if (state === 'paused') {
        l.debug('subscription ignored cause the battle is paused or, probs more likely, ended');

        return;
      }

      if (typeof prevSubscription === 'function') {
        l.debug('calling the original battle.subscribe() function...');
        prevSubscription(state);
      }

      // const calcdexRoom = createSideRoom('view-calcdex', 'Calcdex', true);
      const activeBattle = getActiveBattle();

      if (!activeBattle) {
        l.warn('no active battle found; ignoring Calcdex bootstrap...');

        return;
      }

      if (!activeBattle.calcdexRoom) {
        l.debug('creating a side-room for Calcdex since battle.calcdexRoom is falsy...');
        activeBattle.calcdexRoom = createSideRoom(`view-calcdex-${roomId}`, 'Calcdex', true);
      }

      // activeBattle.nonce = uuidv4();
      activeBattle.nonce = calcBattleCalcdexNonce(activeBattle);

      l.debug('ReactDOM.render()\'ing Calcdex with battle nonce', activeBattle.nonce);

      ReactDOM.render((
        <Calcdex
          // battle={battle}
          // battle={(app.curRoom as BattleRoom).battle}
          battle={activeBattle}
          // tooltips={(app.curRoom as BattleRoom).tooltips}
          tooltips={tooltips}
          // smogon={smogon}
        />
      ), battle.calcdexRoom.el);

      // ReactDOM.render(<Calcdex />, battle.calcdexRoom.el);
    });

    battle.subscriptionDirty = true;
  } else {
    battle.subscription?.('callback');
  }
};
