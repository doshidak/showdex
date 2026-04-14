import * as React from 'react';
import { useCalcdexContext } from '@showdex/components/calc';
import { randBattlesValidatorSlice, useDispatch, useSelector } from '@showdex/redux/store';
import { calcRandomBattlesValidation } from '@showdex/utils/random-battles';

export const useRandomBattlesValidation = () => {
  const { state } = useCalcdexContext();
  const dispatch = useDispatch();

  const battleId = state?.battleId;
  const opponentKey = state?.opponentKey;
  const opponent = opponentKey ? state?.[opponentKey] : null;
  const pokemon = opponent?.pokemon || [];

  const validation = React.useMemo(() => calcRandomBattlesValidation({
    format: state?.format,
    gen: state?.gen,
    pokemon,
    maxTeamSize: Math.max(opponent?.maxPokemon || 0, pokemon.length || 0, 6),
  }), [
    opponent?.maxPokemon,
    opponentKey,
    pokemon,
    state?.format,
    state?.gen,
  ]);

  React.useEffect(() => {
    if (!battleId) {
      return;
    }

    if (!validation.active) {
      dispatch(randBattlesValidatorSlice.actions.clear(battleId));
      return;
    }

    dispatch(randBattlesValidatorSlice.actions.set({
      battleId,
      validation,
    }));
  }, [
    battleId,
    dispatch,
    validation,
  ]);

  const stored = useSelector((root) => root.randBattlesValidator?.[battleId]);

  return stored || validation;
};
