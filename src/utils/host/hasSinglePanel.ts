/**
 * Returns whether the current layout has a single panel from the client's options.
 *
 * * Will return `false` if the layout has left-right panels or the client's options
 *   couldn't be determined.
 * * Appears that while in battle, a viewport width less than `1275px` will collapse
 *   into a single panel.
 *
 * @default false
 * @since 1.0.3
 */
export const hasSinglePanel = (): boolean => (
  app.curRoom?.id?.startsWith('battle-')
    && $?.(window).width() < 1275
)
  || Dex?.prefs?.('onepanel')
  || false;
