import * as React from 'react';
import { type CalcdexBattleState, type ShowdexCalcdexSettings } from '@showdex/redux/store';
import { type CalcdexBattlePresetsHookValue } from '@showdex/utils/presets';

/**
 * State stored in the Calcdex Context.
 *
 * * As of v1.1.7, the abstracted dispatchers have been moved to the `useCalcdexContext()` Consumer hook.
 *
 * @since 1.1.1
 */
export interface CalcdexContextValue {
  state: CalcdexBattleState;
  settings: ShowdexCalcdexSettings;
  presets: CalcdexBattlePresetsHookValue;
}

export const CalcdexContext = React.createContext<CalcdexContextValue>({
  state: {} as CalcdexBattleState,
  settings: {} as ShowdexCalcdexSettings,

  presets: {
    loading: false,
    ready: false,
    presets: [],
    usages: [],
  },
});
