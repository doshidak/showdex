import { type CalcdexBattleState, CalcdexPlayerKeys as AllPlayerKeys } from '@showdex/interfaces/calc';

/**
 * Returns the number of active players in the battle `state`.
 *
 * * This number is determined by the `active` property for each `CalcdexPlayer`.
 * * Returns `0` if this number couldn't be determined.
 *
 * @default 0
 * @since 1.1.5
 */
export const countActivePlayers = (
  state: CalcdexBattleState,
): number => {
  if (!state?.battleId || AllPlayerKeys.every((k) => !(k in state))) {
    return 0;
  }

  return AllPlayerKeys.filter((k) => state[k]?.active).length;
};
