/**
 * Returns whether the current layout has a single panel from the client's options.
 *
 * * Will return `false` if the layout has left-right panels or the client's options
 *   couldn't be determined.
 *
 * @default false
 * @since 1.0.3
 */
export const hasSinglePanel = (): boolean => Dex?.prefs?.('onepanel') || false;
