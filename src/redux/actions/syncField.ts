import { sanitizeField } from '@showdex/utils/battle';
import { logger } from '@showdex/utils/debug';
import type { CalcdexBattleField, CalcdexBattleState } from '@showdex/redux/store';

const l = logger('@showdex/redux/actions/syncField');

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
  const newField = structuredClone(state.field);
  const updatedField = sanitizeField(battle);

  const fieldSideKeys = <(keyof CalcdexBattleField)[]> ['attackerSide', 'defenderSide'];
  const fieldRemainingKeys = (<(keyof CalcdexBattleField)[]> Object.keys(updatedField || {}))
    .filter((key) => !fieldSideKeys.includes(key));

  fieldRemainingKeys.forEach((key) => {
    const value = updatedField?.[key];
    const originalValue = state.field?.[key];

    if (JSON.stringify(value) === JSON.stringify(originalValue)) {
      return;
    }

    (<Record<keyof CalcdexBattleField, unknown>> newField)[key] = value;
  });

  // update (2023/01/22): fieldSideKeys are now attached to each individual CalcdexPlayer under the `side` property
  // fieldSideKeys.forEach((sideKey) => {
  //   Object.keys(newField?.[sideKey] || <CalcdexBattleField> {}).forEach((key) => {
  //     /** @warning Not really type `string`, but was forcibly casted to keep TypeScript happy lol. */
  //     const value = <string> (<Record<keyof CalcdexBattleField, unknown>> updatedField?.[sideKey])?.[key];
  //
  //     if (value === null || value === undefined) {
  //       return;
  //     }
  //
  //     const originalValue = <string> (<Record<keyof CalcdexBattleField, unknown>> newField?.[sideKey])?.[key];
  //
  //     if (JSON.stringify(value) === JSON.stringify(originalValue)) {
  //       return;
  //     }
  //
  //     (<Record<keyof CalcdexBattleField, unknown>> newField[sideKey])[key] = value;
  //   });
  // });

  return newField;
};
