import * as React from 'react';
import type { ColorScheme } from './ColorSchemeContext';
import { ColorSchemeContext } from './ColorSchemeContext';

export const useColorScheme = (): ColorScheme => React.useContext(ColorSchemeContext);
