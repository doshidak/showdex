import { bootstrap as bootstrapCalcdex } from '@showdex/pages';
import { createStore } from '@showdex/redux/store';
import { logger } from '@showdex/utils/debug';
import type { RootStore } from '@showdex/redux/store';
import '@showdex/styles/global.scss';

const l = logger('@showdex/main');

const bootstrappers: ((store: RootStore, roomId?: string) => void)[] = [
  bootstrapCalcdex,
];

const store = createStore();

// eslint-disable-next-line @typescript-eslint/unbound-method
const { receive } = app || {};

if (typeof receive !== 'function') {
  l.warn('main script may have executed too fast lmao');
}

l.debug('hooking into the Showdown client\'s app.receive()...');

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

l.info('completed main script execution!');
