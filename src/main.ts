import { CalcdexBootstrapper, HellodexBootstrapper, TeamdexBootstrapper } from '@showdex/pages';
import { calcdexSlice, createStore, showdexSlice } from '@showdex/redux/store';
import { bakeBakedexBundles, loadI18nextLocales } from '@showdex/utils/app';
import { env, nonEmptyObject } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { openIndexedDb, readHonksDb, readSettingsDb } from '@showdex/utils/storage';
import '@showdex/styles/global.scss';

const l = logger('@showdex/main');

l.debug('Starting', env('build-name', 'showdex'));

// note: checking `Dex` instead of `window.Dex` to verify `window` is a global (i.e., making sure we're probably in a web env)
if (typeof window?.app === 'undefined' || typeof Dex === 'undefined') {
  l.error(
    'main may have executed too fast or',
    'we\'re not in Showdown anymore...',
  );

  throw new Error('Showdex attempted to start in an unsupported website.');
}

// not sure when we'll run into this, but it's entirely possible now that standalone builds are a thing
if (window.__SHOWDEX_INIT) {
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

// we're off to the *races* with this one huehuehuehue
const bootdexMutex: {
  // when false (default), BattleRoom data from app.receive() will be pushed to the battleBuf[];
  // once pre-init async stuff is done, the battleBuf[] is processed & flushed first, then ok is set to true
  ok: boolean;
  battleBuf: [roomId: string, data: string][];
} = {
  ok: false,
  battleBuf: [],
};

l.debug('Hooking into the client\'s app.receive()...');

// make a binded copy of the original app.recieve()
const appReceive = app.receive.bind(app) as typeof app.receive;

app.receive = (data: string) => {
  // call the original function
  // update (2023/02/04): my dumb ass was calling the bootstrapper() BEFORE this,
  // so I was wondering why the `battle` object was never populated... hmm... LOL
  appReceive(data);

  if (typeof data !== 'string' || !data?.length) {
    return;
  }

  // update (2024/07/21): prior to v1.2.4, the auth username was intercepted via app.user.finishRename(), but sometimes
  // the server will emit a guest user first (e.g., '|updateuser| Guest 2545835|0|mira|\n...'), which when the actual
  // registered user is emitted later (like in the example below), finishRename() doesn't fire again for some reason,
  // so we'll just intercept it right from the source! c: (idk why I didn't do this before LOL)
  // e.g., data = '|updateuser| showdex_testee|1|mira|\n{"blockChallenges":false,"blockPMs":false,...'
  if (data.startsWith('|updateuser|')) {
    const [
      , // i.e., ''
      , // i.e., 'updateuser'
      username, // e.g., ' showdex_testee'
      namedCode, // '0' = not registered; '1' = registered
    ] = data.split('|');

    l.debug(
      'app.receive()', 'Logged in as', namedCode === '1' ? 'registered' : 'guest',
      'user', username?.trim() || '???', '(probably)',
      '\n', data,
    );

    if (!username || namedCode !== '1') {
      return;
    }

    return void store.dispatch(showdexSlice.actions.setAuthUsername(username.trim()));
  }

  // e.g., data = '>battle-gen9randombattle-1234567890\n|init|battle|\n|title|P1 vs. P2\n|inactive|Battle timer is ON...'
  if (data.startsWith('>battle-')) {
    const roomId = data.slice(1, data.indexOf('\n'));

    l.debug(
      'app.receive()', 'data for BattleRoom', roomId,
      '\n', data,
    );

    if (!bootdexMutex.ok) {
      return void bootdexMutex.battleBuf.push([roomId, data]);
    }

    // call the Calcdex bootstrapper
    return void CalcdexBootstrapper(store, data, roomId);
  }
};

// note: don't inline await, otherwise, there'll be a race condition with the login
// (also makes the Hellodex not appear immediately when Showdown first opens)
void (async () => {
  const db = await openIndexedDb();
  const settings = await readSettingsDb(db);

  void bakeBakedexBundles({ db, store });

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

  /**
   * @todo May require some special logic to detect when the Teambuilder room opens.
   *   For now, since this only hooks into some Teambuilder functions to update its internal `presets`,
   *   i.e., doesn't render anything, this implementation is fine.
   */
  TeamdexBootstrapper(store);

  // process any buffered Calcdex data first before releasing the shitty 'ok' mutex lock
  bootdexMutex.battleBuf.forEach(([roomId, data]) => void CalcdexBootstrapper(store, data, roomId));
  bootdexMutex.battleBuf = null; // clear for garbaj collection since the bootdexMutex obj will remain in memory
  bootdexMutex.ok = true;
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

l.success(env('build-name', 'showdex'), 'initialized!');
