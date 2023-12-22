import { v4 as uuidv4 } from 'uuid';

export const getHonkdexRoomId = (
  instanceId?: string,
): string => `view-honkdex-${instanceId || uuidv4()}`;
