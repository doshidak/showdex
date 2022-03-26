import * as React from 'react';

export type ColorScheme =
  | 'light'
  | 'dark';

export const ColorSchemeContext = React.createContext<ColorScheme>('light');
