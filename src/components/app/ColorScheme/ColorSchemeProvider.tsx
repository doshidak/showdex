import * as React from 'react';
import { ColorSchemeContext } from './ColorSchemeContext';
import { getColorScheme } from './getColorScheme';

export interface ColorSchemeProviderProps {
  children?: React.ReactNode;
}

export const ColorSchemeProvider = ({
  children,
}: ColorSchemeProviderProps): JSX.Element => {
  const colorScheme = getColorScheme();

  return (
    <ColorSchemeContext.Provider value={colorScheme}>
      {children}
    </ColorSchemeContext.Provider>
  );
};
