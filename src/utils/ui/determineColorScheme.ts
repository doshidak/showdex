/**
 * Returns the `colorScheme` if `reverse` is falsy, otherwise the opposite color scheme is returned.
 *
 * @since 1.2.0
 */
export const determineColorScheme = (
  colorScheme: Showdown.ColorScheme,
  reverse?: boolean,
): Showdown.ColorScheme => (
  (!reverse && colorScheme)
    || (reverse && ((colorScheme === 'light' && 'dark') || 'light'))
    || null
);
