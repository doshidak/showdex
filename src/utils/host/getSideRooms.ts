/**
 * Returns an array of side rooms.
 *
 * * There's a blank room (i.e., its `id` is `''`), which contains the main UI (where the queue and Teambuilder buttons are),
 *   which we're purposefully ignoring here (i.e., `!!room?.id`) since it won't be a side room.
 * * Trailing dash in `'battle-'` is important since there is a `BattlesRoom` with id `'battles'`,
 *   which we want to include in the returned list of side rooms.
 *
 * @since 1.0.2
 */
export const getSideRooms = (): Showdown.ClientRoom[] => Object.values(app.rooms || {})
  .filter((room) => !!room?.id && !room.id.startsWith('battle-') && (room.id === 'rooms' || room.isSideRoom));
