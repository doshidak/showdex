import * as React from 'react';
import { getColorScheme } from '@showdex/utils/app';
import { ColorSchemeContext } from './ColorSchemeContext';

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
