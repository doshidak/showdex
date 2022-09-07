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

export interface CalcdexHookProps {
  battle: Showdown.Battle;
}

export interface CalcdexHookInterface {
  dex: Generation;
  state: CalcdexBattleState;
  updatePokemon: (playerKey: CalcdexPlayerKey, pokemon: DeepPartial<CalcdexPokemon>) => void;
  updateField: (field: DeepPartial<CalcdexBattleField>) => void;
  setActiveIndex: (playerKey: CalcdexPlayerKey, activeIndex: number) => void;
  setSelectionIndex: (playerKey: CalcdexPlayerKey, selectionIndex: number) => void;
  setAutoSelect: (playerKey: CalcdexPlayerKey, autoSelect: boolean) => void;
}

const l = logger('@showdex/pages/Calcdex/useCalcdex');

// we're using the `Dex` from `window.Dex` that the Showdown client uses
// const gens = new Generations(($.extend(true, PkmnDex, Dex) as unknown) as ModdedDex);
// const gens = new Generations(PkmnDex);

export const useCalcdex = ({
  battle,
}: CalcdexHookProps): CalcdexHookInterface => {
  const calcdexState = useCalcdexState();
  const dispatch = useDispatch();

  const battleState = calcdexState[battle?.id];

  l.debug(
    '\n', 'battleState', battleState,
    '\n', 'calcdexState', calcdexState,
  );

  const format = battle?.id?.split?.('-')?.[1];

  // for BDSP, though gen 8, should load from gen 4, otherwise,
  // Calcdex may crash due to incomplete Pokemon entries (like Bibarel)
  const gen = format?.includes('bdsp')
    ? 4
    : battle?.gen as GenerationNum;

  const gens = React.useRef(new Generations(PkmnDex));
  const dex = gens.current.get(gen);

  // const dex = React.useMemo(() => (typeof gen === 'number' && gen > 0 ? <Generation> <unknown> {
  //   ...pkmnDex,
  //   species: (Dex ?? pkmnDex).species,
  //   num: gen,
  // } : null), [
  //   gen,
  //   pkmnDex,
  // ]);

  // handles `battle` changes
  React.useEffect(() => {
    l.debug(
      'Received battle update; determining sync changes...',
      '\n', 'battle.nonce', battle?.nonce,
      '\n', 'battleState.battleNonce', battleState?.battleNonce,
      '\n', 'battle.p1.pokemon', battle?.p1?.pokemon,
      '\n', 'battle.p2.pokemon', battle?.p2?.pokemon,
      '\n', 'battle', battle,
      '\n', 'battleState', battleState,
    );

    if (!battle?.p1 && !battle?.p2 && !battle?.p3 && !battle?.p4) {
      // l.debug(
      //   'Ignoring battle update due to missing players... w0t ??',
      //   '\n', 'battle.p1.pokemon', battle?.p1?.pokemon,
      //   '\n', 'battle.p2.pokemon', battle?.p2?.pokemon,
      //   '\n', 'battle.p3.pokemon', battle?.p3?.pokemon,
      //   '\n', 'battle.p4.pokemon', battle?.p4?.pokemon,
      //   '\n', 'battle', battle,
      //   '\n', 'battleState', battleState,
      // );

      return;
    }

    if (!battle?.nonce) {
      // this means the passed-in `battle` object is not from the bootstrapper
      l.debug(
        'Ignoring battle update due to missing battle.nonce', battle?.nonce,
        '\n', 'battleState.battleNonce', battleState?.battleNonce,
        '\n', 'battle', battle,
        '\n', 'battleState', battleState,
      );

      return;
    }

    if (!battleState?.battleId) {
      l.debug(
        'Initializing empty battleState with battle.nonce', battle.nonce,
        '\n', 'battle', battle,
        '\n', 'battleState', battleState,
      );

      dispatch(calcdexSlice.actions.init({
        battleId: battle.id,
        gen,
        format,
        battleNonce: battle.nonce,
        p1: { name: battle.p1?.name, rating: battle.p1?.rating },
        p2: { name: battle.p2?.name, rating: battle.p2?.rating },
      }));
    } else if (!battleState?.battleNonce || battle.nonce !== battleState.battleNonce) {
      l.debug(
        'Updating battleState via syncBattle() for battle.nonce', battle.nonce,
        '\n', 'battle', battle,
        '\n', 'battleState', battleState,
        // '\n', 'state', state,
      );

      void dispatch(syncBattle({
        battle,
        dex,
      }));
    }

    l.debug(
      'Completed battleState sync for battle.nonce', battle.nonce,
      '\n', 'battle', battle,
      '\n', 'battleState', battleState,
      // '\n', 'state', state,
    );
  }, [
    battle,
    battle?.nonce,
    battleState,
    calcdexState,
    dex,
    dispatch,
    format,
    gen,
  ]);

  return {
    dex,

    state: battleState || {
      battleId: null,
      gen: null,
      format: null,
      rules: null,
      field: null,
      p1: null,
      p2: null,
      // p1: {
      //   name: null,
      //   rating: null,
      //   activeIndex: -1,
      //   selectionIndex: 0,
      //   pokemon: [],
      // },
      // p2: {
      //   name: null,
      //   rating: null,
      //   activeIndex: -1,
      //   selectionIndex: 0,
      //   pokemon: [],
      // },
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
