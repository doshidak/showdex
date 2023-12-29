import { createAsyncThunk } from '@reduxjs/toolkit';
import { type CalcdexBattleState } from '@showdex/interfaces/calc';
import { logger, runtimer } from '@showdex/utils/debug';
import { writeHonksDb } from '@showdex/utils/storage';

export interface SaveHonkdexPayload {
  battleId: string;
}

export const SaveHonkdexActionType = 'honkdex:save' as const;

const l = logger('@showdex/redux/actions/saveHonkdex()');

/**
 * Saves the current standalone `CalcdexBattleState` snapshot, referenced by its `battleId`.
 *
 * @since 1.2.0
 */
export const saveHonkdex = createAsyncThunk<Partial<CalcdexBattleState>, SaveHonkdexPayload>(
  SaveHonkdexActionType,
  async (payload, api) => {
    const endTimer = runtimer(l.scope, l);
    const { battleId } = payload || {};

    if (!battleId) {
      endTimer('(bad args)');

      return null;
    }

    const rootState = api.getState() as Record<'calcdex', Record<string, CalcdexBattleState>>;
    const state = rootState?.calcdex?.[battleId];

    if (!state?.battleId) {
      endTimer('(bad state)');

      return null;
    }

    // update (2023/12/29): no point in checking all the Pokemon here if they could just remove it after it's saved LOL
    const validHonk = state.operatingMode === 'standalone'
      && !!state.gen
      && !!state.format
      && !!state.name;
      // && AllPlayerKeys.some((k) => !!state[k]?.pokemon?.length);

    if (!validHonk) {
      endTimer('(invalid honk)');

      return null;
    }

    const cached = await writeHonksDb(state);

    endTimer(
      '(dispatched)',
      '\n', 'battleId', battleId, 'cached', state.cached,
    );

    return {
      battleId,
      cached,
    };
  },
);
