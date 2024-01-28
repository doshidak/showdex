import { type CalcdexBattleField, type CalcdexBattleState } from '@showdex/interfaces/calc';
import { cloneField, sanitizeField } from '@showdex/utils/battle';
import { nonEmptyObject } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';

const l = logger('@showdex/redux/actions/syncField()');

export const syncField = (
  state: Partial<CalcdexBattleState>,
  battle: Partial<Showdown.Battle>,
): CalcdexBattleField => {
  if (!nonEmptyObject(state?.field) || !battle?.p1) {
    if (__DEV__) {
      l.warn(
        'Received invalid field and/or battle args',
        '\n', 'state.field', state.field,
        '\n', 'battle', battle,
        '\n', '(You will only see this warning on development.)',
      );
    }

    return state?.field;
  }

  // create a sanitized `Field` from the passed-in `battle`, then compare each result for changes
  // (works similarly to `syncPokemon`)
  // update (2023/07/18): structuredClone() is slow af, so removing it from the codebase
  // const newField = structuredClone(state.field);
  const newField = cloneField(state.field);
  const updatedField = sanitizeField(battle);

  Object.keys(updatedField).forEach((key: keyof CalcdexBattleField) => {
    if (['attackerSide', 'defenderSide'].includes(key)) {
      return;
    }

    const value = updatedField?.[key];
    const originalValue = state.field?.[key];

    if (JSON.stringify(value) === JSON.stringify(originalValue)) {
      return;
    }

    (newField as Record<keyof CalcdexBattleField, unknown>)[key] = value;
  });

  newField.autoWeather = null;

  if (newField.weather) {
    newField.dirtyWeather = null;
  }

  newField.autoTerrain = null;

  if (newField.terrain) {
    newField.dirtyTerrain = null;
  }

  return newField;
};
