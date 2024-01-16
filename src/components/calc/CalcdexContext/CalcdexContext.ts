import * as React from 'react';
import { type ShowdexCalcdexSettings } from '@showdex/interfaces/app';
import { type CalcdexBattleState } from '@showdex/interfaces/calc';
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
  saving: [value: boolean, dispatch: React.Dispatch<React.SetStateAction<boolean>>];
  presets: CalcdexBattlePresetsHookValue;
}

export const CalcdexContext = React.createContext<CalcdexContextValue>({
  state: {} as CalcdexBattleState,
  settings: {} as ShowdexCalcdexSettings,
  saving: [false, () => void 0],

  presets: {
    loading: false,
    ready: false,
    presets: [],
    usages: [],
    formatLabelMap: {},
    formeUsages: [],
    formeUsageFinder: () => null,
    formeUsageSorter: () => 0,
  },
});
