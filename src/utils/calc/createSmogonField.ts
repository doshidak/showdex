import { Field as SmogonField } from '@smogon/calc';
import { formatId } from '@showdex/utils/app';
import { countRuinAbilities, ruinAbilitiesActive } from '@showdex/utils/battle';
import type { CalcdexBattleField, CalcdexPlayerKey, CalcdexPokemon } from '@showdex/redux/store';

export const createSmogonField = (
  field: CalcdexBattleField,
  playerPokemon?: CalcdexPokemon,
  playerKey: CalcdexPlayerKey = 'p1',
): SmogonField => {
  if (!field?.gameType) {
    return null;
  }

  const processedField: CalcdexBattleField = {
    ...field,

    attackerSide: playerKey === 'p1' ? field.attackerSide : field.defenderSide,
    defenderSide: playerKey === 'p1' ? field.defenderSide : field.attackerSide,
  };

  // check for Ruin abilities from active Pokemon on the field (gen 9)
  // (ability counts are set in sanitizeField, so ignore processing if they're all 0)
  const hasActiveRuin = ruinAbilitiesActive(field);

  // note that this will apply for the playerPokemon only to calculate the current matchup
  // (specifically the playerPokemon's playerMove in calcSmogonMatchup())
  if (hasActiveRuin) {
    const ruinCounts = countRuinAbilities(field);

    // reduce the number of a Ruin ability by 1 if the playerPokemon has it
    // (for singles, if the count is 1 [from the playerPokemon, for instance], subtracting 1 would result in 0 -> false)
    // (for doubles, if the count is 2, subtracting 1 would result in 1 -> true)
    const ability = formatId(playerPokemon?.dirtyAbility || playerPokemon?.ability);

    // though the reductions from the Ruin abilities stack (which could be possible in, say, doubles),
    // we unfortunately cannot specify how many reductions to make; we can only toggle them on/off
    // (determined these abilities to stack based on the calculateModifiedStats() implementation in pokemon-showdown-client)
    processedField.isBeadsOfRuin = !!Math.max(ruinCounts.beads - (ability === 'beadsofruin' ? 0 : 1), 0);
    processedField.isSwordOfRuin = !!Math.max(ruinCounts.sword - (ability === 'swordofruin' ? 0 : 1), 0);
    processedField.isTabletsOfRuin = !!Math.max(ruinCounts.tablets - (ability === 'tabletsofruin' ? 1 : 0), 0);
    processedField.isVesselOfRuin = !!Math.max(ruinCounts.vessel - (ability === 'vesselofruin' ? 1 : 0), 0);
  }

  // setting this as a variable in case I need to manipulate the instantiated class after
  // (but highly unlikely... probably lmao)
  const smogonField = new SmogonField(processedField);

  return smogonField;
};
