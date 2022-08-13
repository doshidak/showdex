import { Field as SmogonField } from '@smogon/calc';
import type { CalcdexBattleField } from '@showdex/redux/store';

export const createSmogonField = (
  field: CalcdexBattleField,
): SmogonField => {
  if (!field?.gameType) {
    return null;
  }

  // setting this as a variable in case I need to manipulate the instantiated class after
  // (but highly unlikely... probably lmao)
  const smogonField = new SmogonField(field);

  return smogonField;
};
