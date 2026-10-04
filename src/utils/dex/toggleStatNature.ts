/**
 * @file `toggleStatNature.ts`
 * @author Keith Choison <keith@tize.io>
 * @since 1.4.3
 */

import { PokemonNatureBoosts, PokemonStatNames } from '@showdex/consts/dex';
import { getNatureForStats } from './getNatureForStats';

/**
 * Toggles or sets the Pokemon's nature based on modifying a specific stat with '+' (boost) or '-' (lower).
 *
 * * Emulates Pokemon Showdown Teambuilder's +/- nature toggling behavior.
 * * If the stat already has the specified modifier, the modifier is removed and the nature reverts to neutral ('Hardy').
 * * Otherwise, the stat receives the modifier, pairing with an existing opposite modifier or a sensible default.
 * * For HP or invalid stats, the current nature (or 'Hardy') is preserved without change.
 *
 * @example
 * ```ts
 * toggleStatNature('Hardy', 'atk', '+'); // -> 'Adamant' (+Atk, -SpA)
 * toggleStatNature('Adamant', 'atk', '+'); // -> 'Hardy' (boost removed)
 * toggleStatNature('Adamant', 'spe', '+'); // -> 'Jolly' (+Spe, -SpA)
 * toggleStatNature('Adamant', 'spe', '-'); // -> 'Brave' (+Atk, -Spe)
 * toggleStatNature('Timid', 'spe', '-');   // -> 'Quiet' (+SpA, -Spe)
 * ```
 * @since 1.4.3
 */
export const toggleStatNature = (
  currentNature: Showdown.NatureName | undefined,
  stat: Showdown.StatNameNoHp,
  direction: '+' | '-',
): Showdown.NatureName => {
  if (!stat || (stat as string) === 'hp' || !PokemonStatNames.includes(stat)) {
    return currentNature || 'Hardy';
  }

  const [currentUp, currentDown] = PokemonNatureBoosts[currentNature || 'Hardy'] || [];

  if (direction === '+') {
    // If this stat is already boosted, remove the modifier -> return neutral
    if (currentUp === stat) {
      return 'Hardy';
    }

    const newUp = stat;
    let newDown = currentDown;

    if (!newDown || newDown === stat) {
      if (currentDown === stat) {
        newDown = currentUp === 'atk' ? 'spa' : (currentUp === 'spa' ? 'atk' : (currentUp || 'atk'));
      } else {
        newDown = stat === 'atk' ? 'spa' : 'atk';
      }
    }

    if (newDown === newUp) {
      newDown = newUp === 'atk' ? 'spa' : 'atk';
    }

    return getNatureForStats(newUp, newDown);
  }

  if (direction === '-') {
    // If this stat is already lowered, remove the modifier -> return neutral
    if (currentDown === stat) {
      return 'Hardy';
    }

    const newDown = stat;
    let newUp = currentUp;

    if (!newUp || newUp === stat) {
      if (currentUp === stat) {
        newUp = currentDown === 'spa' ? 'atk' : (currentDown === 'atk' ? 'spa' : (currentDown || 'spa'));
      } else {
        newUp = stat === 'spa' ? 'atk' : 'spa';
      }
    }

    if (newUp === newDown) {
      newUp = newDown === 'spa' ? 'atk' : 'spa';
    }

    return getNatureForStats(newUp, newDown);
  }

  return currentNature || 'Hardy';
};
