import { formatId } from './formatId'; /** @todo reorganize me */

export const getCalcdexRoomId = (
  battleId: string,
): string => (battleId ? `view-calcdex-${formatId(battleId)}` : null);
