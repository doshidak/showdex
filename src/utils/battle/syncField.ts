import { logger } from '@showdex/utils/debug';
import type { CalcdexBattleField } from '@showdex/redux/store';
import { sanitizeField } from './sanitizeField';

const l = logger('@showdex/utils/battle/syncField');

export const syncField = (
  field: CalcdexBattleField,
  battle: Partial<Showdown.Battle>,
  attackerIndex = 0,
  defenderIndex = 0,
): CalcdexBattleField => {
  if (!field?.gameType || !battle?.p1) {
    l.warn(
      'received invalid field and/or battle args',
      '\n', 'field', field,
      '\n', 'battle', battle,
      '\n', 'attackerIndex', attackerIndex, 'defenderIndex', defenderIndex,
    );

    return null;
  }

  // create a sanitized `Field` from the passed-in `battle`, then compare each result for changes
  // (works similarly to `syncPokemon`)
  const newField: CalcdexBattleField = { ...field };
  const updatedField = sanitizeField(battle, attackerIndex, defenderIndex);

  const fieldSideKeys = <(keyof CalcdexBattleField)[]> ['attackerSide', 'defenderSide'];
  const fieldRemainingKeys = (<(keyof CalcdexBattleField)[]> Object.keys(updatedField || {}))
    .filter((key) => !fieldSideKeys.includes(key));

  // let didChange = false;

  fieldRemainingKeys.forEach((key) => {
    const value = updatedField?.[key];

    // if (!value && !['string', 'number', 'boolean'].includes(typeof value)) {
    //   return;
    // }

    const originalValue = field?.[key];

    if (JSON.stringify(value) === JSON.stringify(originalValue)) {
      return;
    }

    (<Record<keyof CalcdexBattleField, unknown>> newField)[key] = value;

    // if (!didChange) {
    //   didChange = true;
    // }
  });

  fieldSideKeys.forEach((sideKey) => {
    Object.keys(newField?.[sideKey] || <CalcdexBattleField> {}).forEach((key) => {
      /** @warning Not really type `string`, but was forcibly casted to keep TypeScript happy lol. */
      const value = <string> (<Record<keyof CalcdexBattleField, unknown>> updatedField?.[sideKey])?.[key];

      if (value === null || value === undefined) {
        return;
      }

      const originalValue = <string> (<Record<keyof CalcdexBattleField, unknown>> newField?.[sideKey])?.[key];

      if (JSON.stringify(value) === JSON.stringify(originalValue)) {
        return;
      }

      (<Record<keyof CalcdexBattleField, unknown>> newField[sideKey])[key] = value;

      // if (!didChange) {
      //   didChange = true;
      // }
    });
  });

  // if (!didChange) {
  //   return field;
  // }

  return newField;
};
