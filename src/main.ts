import { calcdexBootstrapper, hellodexBootstrapper } from '@showdex/pages';
import { createStore, showdexSlice } from '@showdex/redux/store';
import { logger } from '@showdex/utils/debug';
import type { RootStore } from '@showdex/redux/store';
import '@showdex/styles/global.scss';

export type ShowdexBootstrapper = (
  store?: RootStore,
  roomId?: string,
) => void;

const l = logger('@showdex/main');

if (typeof app === 'undefined') {
  l.warn('main may have executed too fast cause app is undefined lmao.');
}

const store = createStore();

// list of bootstrappers dependent on a room
const bootstrappers: ShowdexBootstrapper[] = [
  calcdexBootstrapper,
];

l.debug('Hooking into the client\'s app.receive()...');

// make a binded copy of the original app.recieve()
const appReceive = <typeof app.receive> app.receive.bind(app);

app.receive = (data: string) => {
  const receivedRoom = data?.startsWith?.('>');

  if (receivedRoom) {
    const roomId = data.slice(1, data.indexOf('\n'));
    const room = app.rooms[roomId];

    l.debug(
      'receive() event for roomId', roomId,
      '\n', 'room', room,
      '\n', 'data', data,
    );

    // call each bootstrapper
    bootstrappers.forEach((bootstrapper) => bootstrapper(store, roomId));
  }

  // call the original function
  appReceive(data);
};

l.debug('Hooking into the client\'s app.topbar.renderRoomTab()...');

// overwrite the room tab renderer to ignore our special tabHidden property in HtmlRoom
const renderRoomTab = <typeof app.topbar.renderRoomTab> app.topbar.renderRoomTab.bind(app.topbar);

app.topbar.renderRoomTab = (room, id) => {
  if ('tabHidden' in (room || {}) && (<HtmlRoom> <unknown> room).tabHidden) {
    // don't render anything for this room's tab by returning an empty string
    return '';
  }

  return renderRoomTab(room, id);
};

l.debug('Overwriting existing $(window).on(\'beforeunload\') handler...');

// reimplements the beforeunload handler defined in Showdown's client.js to ignore Calcdex rooms
// (fixes the refresh prompt when Calcdex tabs are open, including hidden ones)
// see: https://github.com/smogon/pokemon-showdown-client/blob/master/js/client.js#L582-L597
$(window).off('beforeunload').on('beforeunload', (e: JQuery.TriggeredEvent<Window & typeof globalThis> & BeforeUnloadEvent) => {
  if (Config.server?.host === 'localhost' || app.isDisconnected) {
    return;
  }

  // only check the requestLeave() handler for non-Calcdex rooms
  const nonCalcdexRooms = Object.values(app.rooms)
    .filter((room) => !room?.id?.startsWith('view-calcdex') && typeof room?.requestLeave === 'function' && !room.requestLeave());

  const hasActiveBattles = nonCalcdexRooms.length > 0;

  if (!hasActiveBattles && !Dex.prefs('refreshprompt')) {
    return;
  }

  // e.preventDefault();
  e.returnValue = hasActiveBattles
    ? 'You have active battles.'
    : 'Are you sure you want to refresh?';

  return <string> e.returnValue;
});

l.debug('Initializing MutationObserver for client colorScheme changes...');

// create a MutationObserver to listen for class changes in the <html> tag
// (in order to dispatch colorScheme updates to Redux)
const colorSchemeObserver = new MutationObserver((mutationList) => {
  const [mutation] = mutationList || [];

  if (mutation?.type !== 'attributes') {
    return;
  }

  // determine the color scheme from the presence of a 'dark' class in <html>
  const { className } = (<typeof document.documentElement> mutation.target) || {};
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

// open the Hellodex when the Showdown client starts
// (hence why it's not part of the bootstrappers array)
hellodexBootstrapper(store);

l.info('Completed main execution!');
