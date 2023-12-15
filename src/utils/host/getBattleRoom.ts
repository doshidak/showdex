// import { logger } from '@showdex/utils/debug';

// const l = logger('@showdex/utils/host/getBattleRoom()');

export const getBattleRoom = (
  roomid: string,
): Showdown.BattleRoom => {
  // l.debug(
  //   'attempting to get BattleRoom for roomid', roomid,
  //   '\n', 'app.rooms', app?.rooms,
  // );

  if (!roomid?.startsWith?.('battle-') || !(roomid in (app?.rooms || {}))) {
    return {} as Showdown.BattleRoom;
  }

  return (app.rooms[roomid] ?? {}) as Showdown.BattleRoom;
};
