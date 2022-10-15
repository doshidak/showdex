// import { logger } from '@showdex/utils/debug';

// const l = logger('@showdex/utils/app/getBattleRoom');

export const getBattleRoom = (
  roomid: string,
): Showdown.BattleRoom => {
  // l.debug(
  //   'attempting to get BattleRoom for roomid', roomid,
  //   '\n', 'app.rooms', app?.rooms,
  // );

  if (!roomid?.startsWith?.('battle-') || !(roomid in (app?.rooms || {}))) {
    return <Showdown.BattleRoom> {};
  }

  return <Showdown.BattleRoom> (app.rooms[roomid] ?? {});
};
