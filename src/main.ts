import { calcdexBootstrapper, hellodexBootstrapper } from '@showdex/pages';
import { createStore } from '@showdex/redux/store';
import { logger } from '@showdex/utils/debug';
import type { RootStore } from '@showdex/redux/store';
import '@showdex/styles/global.scss';

export type ShowdexBootstrapper = (
  store?: RootStore,
  roomId?: string,
) => void;

const l = logger('@showdex/main');

// list of bootstrappers dependent on a room
const bootstrappers: ShowdexBootstrapper[] = [
  calcdexBootstrapper,
];

const store = createStore();

// eslint-disable-next-line @typescript-eslint/unbound-method
const { receive } = app || {};

if (typeof receive !== 'function') {
  l.warn('main script may have executed too fast lmao');
}

l.debug('Hooking into the Showdown client\'s app.receive()...');

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
  receive.call(app, data);
};

l.debug('Hooking into the Showdown client\'s app.topbar.renderRoomTab()...');

// overwrite the room tab renderer to ignore our special tabHidden property in HtmlRoom
const renderRoomTab = <typeof app.topbar.renderRoomTab> app.topbar.renderRoomTab.bind(app.topbar);

app.topbar.renderRoomTab = (room, id) => {
  if ('tabHidden' in (room || {}) && (<HtmlRoom> room).tabHidden) {
    return '';
  }

  return renderRoomTab(room, id);
};

l.info('Completed main script execution!');

// open the Hellodex when the Showdown client starts
// (hence why it's not part of the bootstrappers array)
hellodexBootstrapper(store);
