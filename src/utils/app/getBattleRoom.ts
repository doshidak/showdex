import { logger } from '@showdex/utils/debug';

const l = logger('@showdex/utils/app/getBattleRoom');

export const getBattleRoom = (
  roomid: string,
): BattleRoom => {
  l.debug(
    'attempting to get BattleRoom for roomid', roomid,
    '\n', 'app.rooms', app?.rooms,
  );

  if (!roomid?.startsWith?.('battle-') || !(roomid in (app?.rooms || {}))) {
    return <BattleRoom> {};
  }

  return <BattleRoom> <unknown> (app.rooms[roomid] ?? {});
};
