import { formatId } from '@showdex/utils/app';
import type { CalcdexPlayer, CalcdexPlayerSide } from '@showdex/redux/store';

/**
 * Counts the number of each *Ruin* ability for the `CalcdexPlayerSide` of the provided `player`.
 *
 * * This is the function that actually populates these fields, which `countRuinAbilities()` will use
 *   to total up the *Ruin* abilities on each side.
 * * Used to exclusively be in `sanitizePlayerSide()`, but has since been refactored into its own function.
 *   - Needed to repopulate the counts in the `CalcdexProvider`, as well as maintaining its original
 *     functionality in `sanitizePlayerSide()`.
 * * Note that this does **not** mutate the `side` object in the provided `player` (i.e., `player.side`).
 *   - You must spread this function's return value to the existing values of the `CalcdexPlayerSide`.
 *
 * @since 1.1.3
 */
export const countSideRuinAbilities = (
  player: CalcdexPlayer,
): Pick<CalcdexPlayerSide, 'ruinBeadsCount' | 'ruinSwordCount' | 'ruinTabletsCount' | 'ruinVesselCount'> => {
  const { pokemon } = player || {};

  // count how many Pokemon have an activated Ruin ability (gen 9)
  const activeRuin = pokemon
    ?.filter((p) => formatId(p?.dirtyAbility || p?.ability)?.endsWith('ofruin') && p.abilityToggled)
    .map((p) => formatId(p.dirtyAbility || p.ability))
    || [];

  return {
    ruinBeadsCount: activeRuin.filter((a) => a === 'beadsofruin').length,
    ruinSwordCount: activeRuin.filter((a) => a === 'swordofruin').length,
    ruinTabletsCount: activeRuin.filter((a) => a === 'tabletsofruin').length,
    ruinVesselCount: activeRuin.filter((a) => a === 'vesselofruin').length,
  };
};
