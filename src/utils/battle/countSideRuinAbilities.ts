import { type AbilityName, type GameType } from '@smogon/calc';
import { PokemonRuinAbilities } from '@showdex/consts/dex';
import { type CalcdexPlayer, type CalcdexPlayerSide } from '@showdex/interfaces/calc';

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
  gameType?: GameType,
): Pick<CalcdexPlayerSide, 'ruinBeadsCount' | 'ruinSwordCount' | 'ruinTabletsCount' | 'ruinVesselCount'> => {
  const {
    pokemon,
    selectionIndex,
  } = player || {};

  // count how many Pokemon have an activated Ruin ability (gen 9)
  const activeRuin = (gameType === 'Singles' ? [pokemon?.[selectionIndex]] : pokemon)
    ?.map((p) => (gameType === 'Singles' || p?.abilityToggled) && (p?.dirtyAbility || p?.ability))
    .filter((a) => PokemonRuinAbilities.includes(a))
    || [];

  return {
    ruinBeadsCount: activeRuin.filter((a) => a === 'Beads of Ruin' as AbilityName).length,
    ruinSwordCount: activeRuin.filter((a) => a === 'Sword of Ruin' as AbilityName).length,
    ruinTabletsCount: activeRuin.filter((a) => a === 'Tablets of Ruin' as AbilityName).length,
    ruinVesselCount: activeRuin.filter((a) => a === 'Vessel of Ruin' as AbilityName).length,
  };
};
