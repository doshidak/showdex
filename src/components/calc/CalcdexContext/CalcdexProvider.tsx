import * as React from 'react';
import { useCalcdexBattleState, useCalcdexSettings } from '@showdex/redux/store';
// import { logger } from '@showdex/utils/debug';
import { type CalcdexContextValue, CalcdexContext } from './CalcdexContext';
import { useCalcdexPresets } from './useCalcdexPresets';

/**
 * Props passable to the `CalcdexProvider` for initializing the Calcdex Context.
 *
 * @since 1.1.1
 */
export interface CalcdexProviderProps {
  /**
   * ID of a previously initialized battle.
   *
   * * Typically used for opening a Calcdex for a battle that's been previously initialized,
   *   but the battle in the Showdown client has been destroyed (e.g., user left the battle room).
   *   - This is possible since the Calcdex state for the given battle may still exist in Redux.
   * * Won't be passed to Context consumers, but can be read from the returned `state.battleId`.
   *
   * @since 1.1.1
   */
  battleId: string;

  /**
   * Children of the Calcdex Context, of which any can be a Context Consumer.
   *
   * @since 1.1.1
   */
  children: React.ReactNode;
}

// const l = logger('@showdex/components/calc/CalcdexProvider');

export const CalcdexProvider = ({
  battleId,
  children,
}: CalcdexProviderProps): JSX.Element => {
  const state = useCalcdexBattleState(battleId);
  const settings = useCalcdexSettings();
  const saving = React.useState(false);

  // note: we're passing the **entire** return object from the hook as `presets`,
  // which means the actual presets are in presets.presets[] LOL
  const presets = useCalcdexPresets(state, settings);

  // l.debug(
  //   'Providing CalcdexContext for', battleId || '???',
  //   '\n', 'state', state,
  //   '\n', 'settings', settings,
  //   '\n', 'presets', presets,
  // );

  const value = React.useMemo<CalcdexContextValue>(() => ({
    state,
    settings,
    saving,
    presets,
  }), [
    presets,
    saving,
    settings,
    state,
  ]);

  return (
    <CalcdexContext.Provider value={value}>
      {children}
    </CalcdexContext.Provider>
  );
};
