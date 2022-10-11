/**
 * Returns the name of the currently logged-in user.
 *
 * * Will return `null` if the username could not be determined.
 *
 * @default null
 * @since 1.0.3
 */
export const getAuthUsername = (): string => app?.user?.attributes?.name || null;
