import { type ShowdexBootstrapper } from '@showdex/interfaces/app';
import { createHellodexRoom } from '@showdex/utils/app';
import { env } from '@showdex/utils/core';
import { logger, runtimer } from '@showdex/utils/debug';
import { HellodexRenderer } from './Hellodex.renderer';

const l = logger('@showdex/pages/Hellodex/HellodexBootstrapper()');

export const HellodexBootstrapper: ShowdexBootstrapper = (store) => {
  const endTimer = runtimer(l.scope, l);

  l.silly(
    'Hellodex bootstrapper was invoked;',
    'determining if there\'s anything to do...',
  );

  if (!env.bool('hellodex-enabled')) {
    l.debug(
      'Hellodex bootstrap request was ignored',
      'since it has been disabled by the environment.',
    );

    return endTimer('(hellodex denied)');
  }

  const hellodexRoom = createHellodexRoom(store);

  if (!hellodexRoom?.reactRoot) {
    l.error(
      'ReactDOM root has not been initialized by createHellodexRoom().',
      'Something is horribly wrong here!',
      '\n', 'hellodexRoom', '(type)', typeof hellodexRoom, '(now)', hellodexRoom,
      '\n', 'reactRoot', '(type)', typeof hellodexRoom?.reactRoot, '(now)', hellodexRoom?.reactRoot,
    );

    return endTimer('(bad reactRoot)');
  }

  HellodexRenderer(
    hellodexRoom.reactRoot,
    store,
  );

  endTimer('(bootstrap complete)');
};
