import { type ShowdexBootstrapper } from '@showdex/interfaces/app';
import { showdexSlice } from '@showdex/redux/store';
import { createHellodexRoom } from '@showdex/utils/app';
import { env, formatId } from '@showdex/utils/core';
import { logger, runtimer } from '@showdex/utils/debug';
import { HellodexRenderer } from './Hellodex.renderer';

const l = logger('@showdex/pages/Hellodex/HellodexBootstrapper()');

export const HellodexBootstrapper: ShowdexBootstrapper = (store) => {
  const endTimer = runtimer(l.scope, l);

  l.silly(
    'Hellodex bootstrapper was invoked;',
    'determining if there\'s anything to do...',
  );

  if (typeof app?.user?.finishRename === 'function') {
    l.debug('Hooking into the client\'s app.user.finishRename()...');

    const userFinishRename = app.user.finishRename.bind(app.user) as typeof app.user.finishRename;

    app.user.finishRename = (name, assertion) => {
      // call the original function
      userFinishRename(name, assertion);

      // l.debug(
      //   'app.user.finishRename()',
      //   '\n', 'name', name,
      //   '\n', 'assertion', assertion,
      // );

      // determine if the user logged in
      // assertion seems to be some sha256, then the user ID, then 4?, then some timestamp,
      // then some server url, then some sha1, then some half of a sha1 (lol), finally some super long sha hash
      if (!name || !assertion?.includes(',')) {
        return;
      }

      const assertions = assertion.split(',');
      const [, userId] = assertions;

      if (formatId(name) === userId) {
        l.debug(
          'Logged in as', name, '(probably)',
          '\n', 'assertions', assertions,
        );

        return void store.dispatch(showdexSlice.actions.setAuthUsername(name));
      }

      // nt ^_~
      store.dispatch(showdexSlice.actions.updateSettings({
        glassyTerrain: false,
        hellodex: { showDonateButton: true },
      }));
    };
  }

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
