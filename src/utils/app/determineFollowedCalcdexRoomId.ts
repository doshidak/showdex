/**
 * Arguments for `determineFollowedCalcdexRoomId()`.
 *
 * @since 1.4.2
 */
export interface DetermineFollowedCalcdexRoomIdConfig {
  /** Whether the user has the `followBattleTab` Calcdex setting enabled. */
  enabled: boolean;
  /** Whether Showdown is only showing one panel, in which case there's no other panel to follow along in. */
  singlePanel: boolean;
  /** `id` of the room that was just focused, e.g., `'battle-gen9ou-1234567890'`. */
  focusedRoomId: string;
  /** `id`'s of the rooms currently visible in a panel, e.g., the classic `app.curSideRoom` or preact `PS.leftPanel` & `PS.rightPanel`. */
  panelRoomIds: string[];
  /** `id`'s of every room currently open, e.g., `Object.keys(app.rooms)`. */
  openRoomIds: string[];
  /** Host-specific mapping of a battle's room `id` to its Calcdex panel tab's room `id`. */
  toCalcdexRoomId: (battleId: string) => string;
  /** Host-specific check for whether a room `id` belongs to a Calcdex panel tab. */
  isCalcdexRoomId: (roomId: string) => boolean;
}

/**
 * Determines which Calcdex panel tab should be brought forward after a battle tab is focused, if any.
 *
 * * Only ever *replaces* a Calcdex that's already showing, i.e., another panel must be showing a different battle's
 *   Calcdex -- a panel showing anything else (Hellodex, chat, etc.) is left alone.
 * * Returns `null` if there's nothing to do, e.g., the setting's off, Showdown's in single-panel mode, the focused
 *   room isn't a battle, or the focused battle has no Calcdex panel tab open (closed or opened as an overlay).
 *
 * @example
 * ```ts
 * determineFollowedCalcdexRoomId({
 *   enabled: true,
 *   singlePanel: false,
 *   focusedRoomId: 'battle-gen9ou-2',
 *   panelRoomIds: ['calcdex-battle-gen9ou-1'],
 *   openRoomIds: ['battle-gen9ou-1', 'calcdex-battle-gen9ou-1', 'battle-gen9ou-2', 'calcdex-battle-gen9ou-2'],
 *   toCalcdexRoomId: (battleId) => `calcdex-${battleId}`,
 *   isCalcdexRoomId: (roomId) => roomId.startsWith('calcdex-'),
 * });
 *
 * 'calcdex-battle-gen9ou-2'
 * ```
 * @since 1.4.2
 */
export const determineFollowedCalcdexRoomId = ({
  enabled,
  singlePanel,
  focusedRoomId,
  panelRoomIds,
  openRoomIds,
  toCalcdexRoomId,
  isCalcdexRoomId,
}: DetermineFollowedCalcdexRoomIdConfig): string => {
  if (!enabled || singlePanel || !focusedRoomId?.startsWith('battle-')) {
    return null;
  }

  const calcdexRoomId = toCalcdexRoomId(focusedRoomId);

  if (!calcdexRoomId || !openRoomIds?.includes(calcdexRoomId)) {
    return null;
  }

  const visibleRoomIds = (panelRoomIds || []).filter(Boolean);

  // already showing this battle's Calcdex, so nothing to swap
  if (visibleRoomIds.includes(calcdexRoomId)) {
    return null;
  }

  // only take over a panel that's already showing *some* Calcdex
  if (!visibleRoomIds.some((roomId) => isCalcdexRoomId(roomId))) {
    return null;
  }

  return calcdexRoomId;
};
