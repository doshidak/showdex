export type ColorScheme =
  | 'light'
  | 'dark';

export const getColorScheme = (): ColorScheme => {
  const schemeFromPrefs: ColorScheme | 'system' = Dex?.prefs?.('theme');

  switch (schemeFromPrefs) {
    case 'light':
    case 'dark': {
      return schemeFromPrefs;
    }

    case 'system': {
      // just an old habit working with SSR; doesn't hurt to check tho!
      if (typeof window === 'undefined') {
        return 'light';
      }

      const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

      return darkMode ? 'dark' : 'light';
    }

    default: {
      return 'light';
    }
  }
};
