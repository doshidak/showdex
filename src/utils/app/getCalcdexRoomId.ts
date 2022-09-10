import { formatId } from './formatId';

export const getCalcdexRoomId = (
  battleId: string,
): string => (battleId ? `view-calcdex-${formatId(battleId)}` : null);
