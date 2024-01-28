import { CalcdexBootstrapper, HellodexBootstrapper, TeamdexBootstrapper } from '@showdex/pages';
import { calcdexSlice, createStore, showdexSlice } from '@showdex/redux/store';
import { loadI18nextLocales } from '@showdex/utils/app';
import { env, formatId, nonEmptyObject } from '@showdex/utils/core';
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

// not sure when we'll run into this, but it's entirely possible now that standalone builds are a thing
if (window?.__SHOWDEX_INIT) {
  l.error(
    'yo dawg I heard you wanted Showdex with your Showdex',
    '\n', '__SHOWDEX_INIT', window.__SHOWDEX_INIT,
    '\n', 'BUILD_NAME', env('build-name'),
  );

  throw new Error('Another Showdex tried to load despite one already being loaded.');
}

// basically using this as a Showdex init mutex lock lol
window.__SHOWDEX_INIT = env('build-name', 'showdex');

const store = createStore();

l.debug('Hooking into the client\'s app.receive()...');

// make a binded copy of the original app.recieve()
const appReceive = app.receive.bind(app) as typeof app.receive;

app.receive = (data: string) => {
  const receivedRoom = data?.startsWith?.('>');

  // call the original function
  // update (2023/02/04): my dumb ass was calling the bootstrapper() BEFORE this,
  // so I was wondering why the `battle` object was never populated... hmm... LOL
  appReceive(data);

  if (!receivedRoom) {
    return;
  }

  const roomId = data.slice(1, data.indexOf('\n'));

  l.debug(
    'receive() for', roomId,
    '\n', data,
  );

  // call the Calcdex bootstrapper
  CalcdexBootstrapper(store, data, roomId);
};

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

// note: don't inline await, otherwise, there'll be a race condition with the login
// (also makes the Hellodex not appear immediately when Showdown first opens)
void (async () => {
  const db = await openIndexedDb();
  const settings = await readSettingsDb(db);

  // note: settings.locale's default value is `null`, which will allow the i18next LanguageDetector plugin to kick in
  const i18next = await loadI18nextLocales(settings?.locale);

  if (nonEmptyObject(settings)) {
    delete settings.colorScheme;

    store.dispatch(showdexSlice.actions.updateSettings({
      ...settings,
      locale: settings.locale || i18next?.language || 'en', // fucc it yolo
    }));
  }

  const honks = await readHonksDb(db);

  if (nonEmptyObject(honks)) {
    store.dispatch(calcdexSlice.actions.restore(honks));
  }

  // open the Hellodex when the Showdown client starts
  HellodexBootstrapper(store);
})();

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
