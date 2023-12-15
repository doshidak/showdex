/**
 * Determines the value of the `'system'` color scheme via `window.matchMedia()`.
 *
 * * Runs a media query checking if `prefers-color-scheme` is `dark`.
 *   - Value is based on the user's OS-wide color scheme.
 * * Returns `null` if the media query could not be executed.
 *
 * @since 1.0.2
 */
export const getSystemColorScheme = (): Showdown.ColorScheme => {
  // just an old habit working with SSR; doesn't hurt to check tho!
  if (typeof window === 'undefined') {
    return null;
  }

  const queryResult = window.matchMedia?.('(prefers-color-scheme: dark)');

  // make sure we get a valid result back
  if (typeof queryResult?.matches !== 'boolean') {
    return null;
  }

  return queryResult.matches
    ? 'dark'
    : 'light';
};

/**
 * Returns the color scheme from the client's options.
 *
 * * Defaults to the `'light'` color scheme in cases where the user's
 *   color scheme preference could not be determined.
 *
 * @since 0.1.2
 */
export const getColorScheme = (): Showdown.ColorScheme => {
  const schemeFromPrefs = Dex?.prefs?.('theme');

  switch (schemeFromPrefs) {
    case 'light':
    case 'dark': {
      return schemeFromPrefs;
    }

    case 'system': {
      const systemScheme = getSystemColorScheme();

      if (systemScheme) {
        return systemScheme;
      }

      break;
    }

    default: {
      break;
    }
  }

  return 'light';
};
