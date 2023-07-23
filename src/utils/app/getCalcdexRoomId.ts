import { formatId } from '@showdex/utils/core';

export const getCalcdexRoomId = (
  battleId: string,
): string => (battleId ? `view-calcdex-${formatId(battleId)}` : null);
