import { type CalcdexPlayerKey, CalcdexPlayerKeys as AllPlayerKeys } from '@showdex/interfaces/calc';

/**
 * Determines if the player with the `playerKey` has used Terastallization in the battle.
 *
 * * Primarily used to populate the `usedTera` property in the `CalcdexPlayer`.
 * * Determined via the existence of the following `stepQueue` entry:
 *   - `'|-terastallize|<playerKey><a | b>: <pokemon.name>|<pokemon.teraType>'`
 *
 * @since 1.1.3
 */
export const usedTerastallization = (
  playerKey: CalcdexPlayerKey,
  stepQueue: string[],
): boolean => AllPlayerKeys.includes(playerKey)
  && !!stepQueue?.length
  && stepQueue.some((q) => q.startsWith(`|-terastallize|${playerKey}`));
