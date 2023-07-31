import { type CalcdexBattleField, type CalcdexBattleState } from '@showdex/redux/store';
import { cloneField, sanitizeField } from '@showdex/utils/battle';
import { logger } from '@showdex/utils/debug';

const l = logger('@showdex/redux/actions/syncField()');

export const syncField = (
  state: Partial<CalcdexBattleState>,
  battle: Partial<Showdown.Battle>,
): CalcdexBattleField => {
  if (!state?.field?.gameType || !battle?.p1) {
    if (__DEV__) {
      l.warn(
        'Received invalid field and/or battle args',
        '\n', 'state.field', state.field,
        '\n', 'battle', battle,
        '\n', '(You will only see this warning on development.)',
      );
    }

    return null;
  }

  // create a sanitized `Field` from the passed-in `battle`, then compare each result for changes
  // (works similarly to `syncPokemon`)
  // update (2023/07/18): structuredClone() is slow af, so removing it from the codebase
  // const newField = structuredClone(state.field);
  const newField = cloneField(state.field);
  const updatedField = sanitizeField(battle);

  const fieldSideKeys = ['attackerSide', 'defenderSide'] as (keyof CalcdexBattleField)[];
  const fieldRemainingKeys = (Object.keys(updatedField || {}) as (keyof CalcdexBattleField)[])
    .filter((key) => !fieldSideKeys.includes(key));

  fieldRemainingKeys.forEach((key) => {
    const value = updatedField?.[key];
    const originalValue = state.field?.[key];

    if (JSON.stringify(value) === JSON.stringify(originalValue)) {
      return;
    }

    (newField as Record<keyof CalcdexBattleField, unknown>)[key] = value;
  });

  return newField;
};
