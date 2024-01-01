import * as ReactDOM from 'react-dom/client';
import { v4 as uuidv4 } from 'uuid';
import { type GenerationNum } from '@smogon/calc';
import { type CalcdexBattleState } from '@showdex/interfaces/calc';
import { type CalcdexSliceState, type RootStore, calcdexSlice } from '@showdex/redux/store';
import { env, nonEmptyObject } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { detectDoublesFormat, getGenfulFormat } from '@showdex/utils/dex';
import { createHonkdexRoom } from './createHonkdexRoom';
import { getHonkdexRoomId } from './getHonkdexRoomId';

const l = logger('@showdex/utils/app/openHonkdexInstance()');

/**
 * Opens an existing Honkdex tab or creates a new one if an `instanceId` wasn't provided.
 *
 * * Nothing happens if the provided `instanceId` doesn't exist.
 *
 * @since 1.2.0
 */
export const openHonkdexInstance = (
  store: RootStore,
  renderer: (
    dom: ReactDOM.Root,
    store: RootStore,
    instanceId: string,
  ) => void,
  instanceId?: string,
  initState?: Partial<CalcdexBattleState>,
): void => {
  const shouldOpen = nonEmptyObject(app?.rooms)
    && typeof store?.getState === 'function'
    && typeof renderer === 'function';

  if (!shouldOpen) {
    return;
  }

  const id = instanceId || uuidv4();
  const roomId = getHonkdexRoomId(id);

  if (roomId in app.rooms) {
    return void app.focusRoomRight(roomId);
  }

  const instances = store.getState()?.calcdex as CalcdexSliceState;

  if (!instances?.[id]) {
    // setting defaults for now; user will be able to change these in the UI shortly
    // (as a future feature, could store the user's last config & restore them here)
    const gen = initState?.gen || env.int<GenerationNum>(
      'honkdex-default-gen',
      env.int<GenerationNum>('calcdex-default-gen', null),
    );

    const format = getGenfulFormat(gen, initState?.format || env('honkdex-default-format'));

    // note: in 'standalone' mode, maxPokemon will extend by the HONKDEX_PLAYER_EXTEND_POKEMON value when the length of
    // the pokemon[] exceeds the current value; HONKDEX_PLAYER_MIN_POKEMON is the minimum shown Pokemon in the UI,
    // hence it's also the initial value during state initialization
    const maxPokemon = env.int('honkdex-player-min-pokemon', 0);

    store.dispatch(calcdexSlice.actions.init({
      scope: l.scope,

      operatingMode: 'standalone',
      battleId: id, // should've made an `id` prop in hindsight, so recycling battleId v_v
      gen,
      format,
      gameType: detectDoublesFormat(format) ? 'Doubles' : 'Singles',
      turn: 0,
      active: false, // technically not an active battle!
      renderMode: 'panel', // always rendered inside of a 'panel' in 'standalone' mode
      playerKey: 'p1',
      opponentKey: 'p2',
      switchPlayers: false,

      p1: {
        name: 'Side A', // these don't matter; won't show up in the UI
        rating: -1,
        active: true,
        maxPokemon,
      },

      p2: {
        name: 'Side B',
        rating: -1,
        active: true,
        maxPokemon,
      },
    }));
  }

  const honkdexRoom = createHonkdexRoom(id, true);

  renderer(
    honkdexRoom.reactRoot,
    store,
    id,
  );
};
