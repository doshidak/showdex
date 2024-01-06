import { CalcdexBootstrapper, HellodexBootstrapper, TeamdexBootstrapper } from '@showdex/pages';
import { calcdexSlice, createStore, showdexSlice } from '@showdex/redux/store';
import { env, nonEmptyObject } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { openIndexedDb, readHonksDb, readSettingsDb } from '@showdex/utils/storage';
import '@showdex/styles/global.scss';

const l = logger('@showdex/main');

l.debug('Starting', env('build-name', 'showdex'));

if (typeof app === 'undefined' || typeof Dex === 'undefined') {
  l.error(
    'main may have executed too fast or',
    'we\'re not in Showdown anymore...',
  );

  throw new Error('Showdex attempted to start in an unsupported website.');
}

const store = createStore();

// note: don't inline await, otherwise, there'll be a race condition with the login
// (also makes the Hellodex not appear immediately when Showdown first opens)
void (async () => {
  const db = await openIndexedDb();
  const settings = await readSettingsDb(db);

  if (nonEmptyObject(settings)) {
    delete settings.colorScheme;
    store.dispatch(showdexSlice.actions.updateSettings(settings));
  }

  const honks = await readHonksDb(db);

  if (nonEmptyObject(honks)) {
    store.dispatch(calcdexSlice.actions.restore(honks));
  }

  // open the Hellodex when the Showdown client starts
  HellodexBootstrapper(store);
})();

l.debug('Hooking into the client\'s app.receive()...');

// make a binded copy of the original app.recieve()
const appReceive = app.receive.bind(app) as typeof app.receive;

app.receive = (data: string) => {
  const receivedRoom = data?.startsWith?.('>');

  // call the original function
  // update (2023/02/04): my dumb ass was calling the bootstrapper() BEFORE this,
  // so I was wondering why the `battle` object was never populated... hmm... LOL
  appReceive(data);

  if (receivedRoom) {
    const roomId = data.slice(1, data.indexOf('\n'));
    // const room = app.rooms[roomId];

    l.debug(
      'receive() for', roomId,
      '\n', data,
    );

    // call the Calcdex bootstrapper
    CalcdexBootstrapper(store, data, roomId);
  }
};

l.debug('Initializing MutationObserver for client colorScheme changes...');

// create a MutationObserver to listen for class changes in the <html> tag
// (in order to dispatch colorScheme updates to Redux)
const colorSchemeObserver = new MutationObserver((mutationList) => {
  const [mutation] = mutationList || [];

  if (mutation?.type !== 'attributes') {
    return;
  }

  // determine the color scheme from the presence of a 'dark' class in <html>
  const { className } = (mutation.target as typeof document.documentElement) || {};
  const colorScheme: Showdown.ColorScheme = className?.includes('dark') ? 'dark' : 'light';

  store.dispatch(showdexSlice.actions.setColorScheme(colorScheme));
});

// note: document.documentElement is a ref to the <html> tag
colorSchemeObserver.observe(document.documentElement, {
  // observe only 'class' attribute on <html>
  attributes: true,
  attributeFilter: ['class'],

  // don't observe the <html>'s children or data
  childList: false,
  characterData: false,
});

/**
 * @todo May require some special logic to detect when the Teambuilder room opens.
 *   For now, since this only hooks into some Teambuilder functions to update its internal `presets`,
 *   i.e., doesn't render anything, this implementation is fine.
 */
TeamdexBootstrapper(store);

l.success(env('build-name', 'showdex'), 'initialized!');
