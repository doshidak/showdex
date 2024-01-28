/**
 * Returns the Hellodex's Showdown room ID, which is hardcoded & doesn't change based on args.
 *
 * * Could've been just a `const`, but in keeping with the APIs of the other rooms (e.g., `getCalcdexRoomId()`),
 *   this is needlessly a `function` instead.
 * * ligma
 *
 * @since 1.2.3
 */
export const getHellodexRoomId = (): string => 'view-hellodex';
