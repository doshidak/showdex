import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { createSideRoom } from '@showdex/utils/app';
import { Calcdex } from './Calcdex';

export const bootstrap = (roomId?: string): void => {
  console.log('bootstrapping calcdex...');

  if (!roomId?.startsWith?.('battle-')) {
    console.log('bootstrap request ignored for roomId', roomId);

    return;
  }

  const { battle, tooltips } = app.curRoom as BattleRoom;

  if (!battle) {
    console.log('bootstrap request ignored for roomId', roomId, 'since no battle exists');

    return;
  }

  if (typeof battle?.subscribe !== 'function') {
    console.warn('must have the wrong battle object cause battle.subscribe() is apparently type', typeof battle?.subscribe);

    return;
  }

  console.log('subscribing to battle events via battle.subscribe()...');

  const {
    subscription,
    prevSubscription,
    subscriptionDirty,
  } = battle || { subscription: null };

  if (typeof subscription === 'function') {
    battle.prevSubscription = subscription;
  }

  if (!subscriptionDirty) {
    battle.subscribe((state) => {
      console.log('battle state:', state);

      prevSubscription?.(state);

      const calcdexRoom = createSideRoom('view-calcdex', 'Calcdex', true);
      // const activeBattle = getActiveBattle();

      ReactDOM.render((
        <Calcdex
          battle={battle}
          tooltips={tooltips}
        />
      ), calcdexRoom.el);
    });

    battle.subscriptionDirty = true;
  }
};
