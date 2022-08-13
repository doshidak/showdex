import * as React from 'react';
import { Generations } from '@pkmn/data';
import { Dex as PkmnDex } from '@pkmn/dex';
import { syncBattle } from '@showdex/redux/actions';
import { calcdexSlice, useCalcdexState, useDispatch } from '@showdex/redux/store';
import { logger } from '@showdex/utils/debug';
import type { Generation, GenerationNum } from '@pkmn/data';
import type {
  CalcdexBattleField,
  CalcdexBattleState,
  CalcdexPlayerKey,
  CalcdexPokemon,
} from '@showdex/redux/store';
// import { usePresetCache } from './usePresetCache';

export interface CalcdexHookProps {
  battle: Showdown.Battle;
  // tooltips: Showdown.BattleTooltips;
  // smogon: PkmnSmogon;
}

export interface CalcdexHookInterface {
  dex: Generation;
  state: CalcdexBattleState;
  // dispatch: CalcdexReducerDispatch;
  // addPokemon: (pokemon: Partial<CalcdexPokemon>) => Promise<void>;
  updatePokemon: (playerKey: CalcdexPlayerKey, pokemon: DeepPartial<CalcdexPokemon>) => void;
  // syncPokemon: (pokemon: Partial<CalcdexPokemon>) => void;
  updateField: (field: DeepPartial<CalcdexBattleField>) => void;
  setActiveIndex: (playerKey: CalcdexPlayerKey, activeIndex: number) => void;
  setSelectionIndex: (playerKey: CalcdexPlayerKey, selectionIndex: number) => void;
  setAutoSelect: (playerKey: CalcdexPlayerKey, autoSelect: boolean) => void;
}

const l = logger('@showdex/pages/Calcdex/useCalcdex');

// we're using the `Dex` from `window.Dex` that the Showdown client uses
// const gens = new Generations(($.extend(true, PkmnDex, Dex) as unknown) as ModdedDex);
const gens = new Generations(PkmnDex);

export const useCalcdex = ({
  battle,
  // tooltips,
  // smogon,
}: CalcdexHookProps): CalcdexHookInterface => {
  // const [state, dispatch] = useThunkyReducer(
  //   CalcdexReducer,
  //   { ...CalcdexInitialState },
  // );
  const state = useCalcdexState();
  const dispatch = useDispatch();

  const battleState = state[battle?.id];

  l.debug(
    '\n', 'state', state,
    '\n', 'battleState', battleState,
  );

  // const [prevNonce, setPrevNonce] = React.useState<string>(null);
  // const presetCache = usePresetCache();

  const gen = battle?.gen as GenerationNum;
  const format = battle?.id?.split?.('-')?.[1];

  const pkmnDex = gens.get(gen);
  // const dex = React.useMemo(() => (typeof gen === 'number' && gen > 0 ? gens.get(gen) : null), [gen]);
  const dex = React.useMemo(() => (typeof gen === 'number' && gen > 0 ? <Generation> <unknown> {
    ...pkmnDex,
    species: (Dex ?? pkmnDex).species,
    num: gen,
  } : null), [
    gen,
    pkmnDex,
  ]);

  // handles `battle` changes
  React.useEffect(() => {
    l.debug(
      'React.useEffect()',
      'received battle update; determining sync changes...',
      '\n', 'battle.nonce', battle?.nonce,
      '\n', 'battleState.battleNonce', battleState?.battleNonce,
      '\n', 'battle.p1.pokemon', battle?.p1?.pokemon,
      '\n', 'battle.p2.pokemon', battle?.p2?.pokemon,
      '\n', 'battle', battle,
      '\n', 'state', state,
    );

    if (!battle?.p1 && !battle?.p2 && !battle?.p3 && !battle?.p4) {
      l.debug(
        'React.useEffect()',
        'ignoring battle update due to missing players... w0t',
        '\n', 'battle.p1.pokemon', battle?.p1?.pokemon,
        '\n', 'battle.p2.pokemon', battle?.p2?.pokemon,
        '\n', 'battle.p3.pokemon', battle?.p3?.pokemon,
        '\n', 'battle.p4.pokemon', battle?.p4?.pokemon,
        '\n', 'battle', battle,
        '\n', 'state', state,
      );

      return;
    }

    if (!battle?.nonce) {
      // this means the passed-in `battle` object is not from the bootstrapper
      l.debug(
        'React.useEffect()',
        'ignoring battle update due to missing nonce', battle?.nonce,
        '\n', 'battle', battle,
        '\n', 'state', state,
      );

      return;
    }

    // if (battle.nonce === battleState.battleNonce) {
    //   l.debug(
    //     'React.useEffect()',
    //     'ignoring battle update since nonce hasn\'t changed',
    //     '\n', 'battle.nonce', battle.nonce,
    //     '\n', 'battleState.battleNonce', battleState.battleNonce,
    //     '\n', 'battle', battle,
    //     '\n', 'state', state,
    //   );
    //
    //   return;
    // }

    if (!battleState?.battleId) {
      l.debug(
        'React.useEffect()',
        'initializing empty battleState',
        '\n', 'with battle.nonce', battle.nonce,
        '\n', 'battle', battle,
        '\n', 'battleState', battleState,
      );

      dispatch(calcdexSlice.actions.init({
        battleId: battle.id,
        gen: battle.gen,
        format,
        battleNonce: battle.nonce,
        p1: { name: battle.p1?.name, rating: battle.p1?.rating },
        p2: { name: battle.p2?.name, rating: battle.p2?.rating },
      }));
    } else if (!battleState?.battleNonce || battle.nonce !== battleState.battleNonce) {
      l.debug(
        'React.useEffect()',
        'updating battleState via syncBattle()',
        '\n', 'battle', battle,
        '\n', 'battleState', battleState,
        '\n', 'state', state,
      );

      void dispatch(syncBattle({
        battle,
        dex,
      }));
    }

    l.debug(
      'React.useEffect()',
      'completed battle state sync for nonce', battle.nonce,
      '\n', 'battle', battle,
      '\n', 'state', state,
    );
  }, [
    battle,
    battle?.nonce,
    battleState,
    dex,
    dispatch,
    format,
    // presetCache,
    state,
  ]);

  return {
    dex,

    state: battleState || {
      battleId: null,
      gen: null,
      format: null,
      field: null,
      p1: {
        name: null,
        rating: null,
        activeIndex: -1,
        selectionIndex: 0,
        pokemon: [],
      },
      p2: {
        name: null,
        rating: null,
        activeIndex: -1,
        selectionIndex: 0,
        pokemon: [],
      },
    },

    updatePokemon: (playerKey, pokemon) => dispatch(calcdexSlice.actions.updatePokemon({
      battleId: battle?.id,
      playerKey,
      pokemon,
    })),

    updateField: (field) => dispatch(calcdexSlice.actions.updateField({
      battleId: battle?.id,
      field,
    })),

    setActiveIndex: (playerKey, activeIndex) => dispatch(calcdexSlice.actions.updatePlayer({
      battleId: battle?.id,
      [playerKey]: { activeIndex },
    })),

    setSelectionIndex: (playerKey, selectionIndex) => dispatch(calcdexSlice.actions.updatePlayer({
      battleId: battle?.id,
      [playerKey]: { selectionIndex },
    })),

    setAutoSelect: (playerKey, autoSelect) => dispatch(calcdexSlice.actions.updatePlayer({
      battleId: battle?.id,
      [playerKey]: { autoSelect },
    })),
  };
};
