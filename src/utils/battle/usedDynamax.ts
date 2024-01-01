import { type CalcdexPlayerKey, CalcdexPlayerKeys as AllPlayerKeys } from '@showdex/interfaces/calc';

/**
 * Determines if the player with the `playerKey` has used Dynamax in the battle.
 *
 * * Primarily used to populate the `usedMax` property in the `CalcdexPlayer`.
 * * Determined via the existence of the following `stepQueue` entry:
 *   - `'|-start|<playerKey><a | b>: <pokemon.name>|Dynamax|'
 *
 * @since 1.1.3
 */
export const usedDynamax = (
  playerKey: CalcdexPlayerKey,
  stepQueue: string[],
): boolean => AllPlayerKeys.includes(playerKey)
  && !!stepQueue?.length
  && stepQueue.some((q) => (
    q.startsWith(`|-start|${playerKey}`)
      && q.toLowerCase().includes('|dynamax')
  ));
