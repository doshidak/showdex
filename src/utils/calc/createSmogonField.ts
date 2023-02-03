import { Field as SmogonField } from '@smogon/calc';
import { formatId } from '@showdex/utils/app';
import { countRuinAbilities, ruinAbilitiesActive } from '@showdex/utils/battle';
import type { CalcdexBattleField, CalcdexPlayer } from '@showdex/redux/store';

export const createSmogonField = (
  field: CalcdexBattleField,
  player?: CalcdexPlayer,
  opponent?: CalcdexPlayer,
  allPlayers?: CalcdexPlayer[],
): SmogonField => {
  if (!field?.gameType) {
    return null;
  }

  const processedField: CalcdexBattleField = {
    ...field,
    attackerSide: player?.side,
    defenderSide: opponent?.side,
  };

  const allPlayerSides = (allPlayers || [player, opponent])?.map((p) => p?.side) || [];

  // check for Ruin abilities from active Pokemon on the field (gen 9)
  // (ability counts are set in sanitizeField, so ignore processing if they're all 0)
  const hasActiveRuin = ruinAbilitiesActive(...allPlayerSides);

  // update (2023/01/30): @smogon/calc now implemented the Ruin effects if the Pokemon has them
  // (before they did nothing), so we don't need to rely on these field toggles if not Doubles
  // (more processing, such as Ruin abilities canceling each other out, is done in createSmogonPokemon(), btw)
  const doubles = processedField.gameType === 'Doubles';

  // note that this will apply for the playerPokemon only to calculate the current matchup
  // (specifically the playerPokemon's playerMove in calcSmogonMatchup())
  if (hasActiveRuin && doubles) {
    const ruinCounts = countRuinAbilities(...allPlayerSides);

    // update (2023/01/31): check if any of the Pokemon in the 1v1 matchup (Pokemon at the selectionIndex for both players)
    // have a Ruin ability, and if not, set these field toggles. DON'T set them if one of them DO have the specific Ruin ability.
    // (@smogon/calc has implemented the stat drop effects in the abilities themselves, so no need to solely rely on these toggles
    // as we had to in prior versions since the Ruin abilities did nothing then)
    const playerSelection = player.pokemon[player.selectionIndex];
    const playerAbility = formatId(playerSelection?.dirtyAbility || playerSelection?.ability);
    const opponentSelection = opponent.pokemon[opponent.selectionIndex];
    const opponentAbility = formatId(opponentSelection?.dirtyAbility || opponentSelection?.ability);
    const matchupAbilities = [playerAbility, opponentAbility].filter(Boolean);

    processedField.isBeadsOfRuin = !matchupAbilities.includes('beadsofruin') && ruinCounts.beads > 0;
    processedField.isSwordOfRuin = !matchupAbilities.includes('swordofruin') && ruinCounts.sword > 0;
    processedField.isTabletsOfRuin = !matchupAbilities.includes('tabletsofruin') && ruinCounts.tablets > 0;
    processedField.isVesselOfRuin = !matchupAbilities.includes('vesselofruin') && ruinCounts.vessel > 0;

    // reduce the number of a Ruin ability by 1 if the playerPokemon has it
    // (for singles, if the count is 1 [from the playerPokemon, for instance], subtracting 1 would result in 0 -> false)
    // (for doubles, if the count is 2, subtracting 1 would result in 1 -> true)
    // const ability = formatId(playerPokemon?.dirtyAbility || playerPokemon?.ability);

    // update (2023/01/23): @smogon/calc will now account for the Ruin abilities in 1v1 Pokemon matchups if the Pokemon
    // have the ability, but in order to fix Ruin abilities not cancelling each other out, we secretly set any Ruin ability
    // in createSmogonPokemon() to Pressure, applying the effects through these toggles
    // processedField.isBeadsOfRuin = !!Math.max(ruinCounts.beads - (ability === 'beadsofruin' ? 0 : ruinCounts.beads), 0);
    // processedField.isSwordOfRuin = !!Math.max(ruinCounts.sword - (ability === 'swordofruin' ? 0 : ruinCounts.sword), 0);
    // processedField.isTabletsOfRuin = !!Math.max(ruinCounts.tablets - (ability === 'tabletsofruin' ? ruinCounts.tablets : 0), 0);
    // processedField.isVesselOfRuin = !!Math.max(ruinCounts.vessel - (ability === 'vesselofruin' ? ruinCounts.vessel : 0), 0);
  }

  // setting this as a variable in case I need to manipulate the instantiated class after
  // (but highly unlikely... probably lmao)
  const smogonField = new SmogonField(processedField);

  return smogonField;
};
