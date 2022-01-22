import { bootstrap as bootstrapCalcdex } from '@showdex/pages';
import '@showdex/styles/global.scss';

const bootstrappers: ((roomId?: string) => void)[] = [
  bootstrapCalcdex,
];

// eslint-disable-next-line @typescript-eslint/unbound-method
const { receive } = app || {};

if (typeof receive !== 'function') {
  console.log('main script may have executed too fast lmao');
}

console.log('injecting into app.receive()...');

app.receive = (data: string) => {
  const receivedRoom = data?.startsWith?.('>');

  if (receivedRoom) {
    const roomId = data.slice(1, data.indexOf('\n') - 1);
    const room = app.rooms[roomId];

    console.log('received socket event for roomId', roomId, room);

    // call each bootstrapper
    bootstrappers.forEach((bootstrapper) => bootstrapper(roomId));
  }

  // call the original function
  receive.call(app, data);
};

console.log('completed main script execution!');
