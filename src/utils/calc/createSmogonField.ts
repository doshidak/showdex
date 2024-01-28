import { type GameType, Field as SmogonField, State as SmogonState } from '@smogon/calc';
import { type CalcdexBattleField, type CalcdexPlayer } from '@showdex/interfaces/calc';
import { clonePlayerSide, countRuinAbilities, ruinAbilitiesActive } from '@showdex/utils/battle';
import { formatId, nonEmptyObject } from '@showdex/utils/core';
import { detectGenFromFormat } from '@showdex/utils/dex';

export const createSmogonField = (
  format: string,
  gameType: GameType,
  field: CalcdexBattleField,
  player?: CalcdexPlayer,
  opponent?: CalcdexPlayer,
  allPlayers?: CalcdexPlayer[],
): SmogonField => {
  const gen = detectGenFromFormat(format);

  if (!format || !gen || !nonEmptyObject(field)) {
    return null;
  }

  // note: using structuredClone() for attackerSide & defenderSide here since we may mutate their
  // properties for hazards, so we don't want to accidentally mutate their original objects from the args!
  // update (2023/07/18): structuredClone() is slow af, so removing it from the codebase
  // update (2024/01/27): dirtyWeather & dirtyTerrain function similarly to dirtyItem, where they'll be an empty string
  // (vs null) when the user explicitly requested to clear them, despite them being actually on the field
  const processedField: Partial<SmogonState.Field> = {
    ...field,
    gameType,
    weather: (field.dirtyWeather ?? field.weather) || null,
    terrain: (field.dirtyTerrain ?? field.terrain) || null,
    // attackerSide: structuredClone(player?.side || {}),
    // defenderSide: structuredClone(opponent?.side || {}),
    attackerSide: clonePlayerSide(player?.side),
    defenderSide: clonePlayerSide(opponent?.side),
  };

  if ('dirtyWeather' in processedField) {
    delete processedField.dirtyWeather;
  }

  if ('dirtyTerrain' in processedField) {
    delete processedField.dirtyTerrain;
  }

  // check if we should remove field hazards (e.g., Spikes, Stealth Rocks) if the selected Pokemon
  // we're doing calcs for is already out on the field (i.e., if the selectionIndex is in the activeIndices)
  // (note: since this is an array of objects, the objects are actually references to them, so we'll be mutating
  // the original object [e.g., processedField.attackerSide] when modifying properties in `side`)
  if (gen > 1) {
    [
      processedField.attackerSide,
      processedField.defenderSide,
    ].forEach((side, i) => {
      const {
        selectionIndex,
        activeIndices,
      } = (i === 0 ? player : opponent) || {};

      if (selectionIndex < 0 || !activeIndices?.length) {
        return;
      }

      // here, we're allowing whatever value is currently stored to apply since the selected Pokemon isn't active
      if (!activeIndices.includes(selectionIndex)) {
        return;
      }

      // now we know the selected Pokemon is active, so reset the hazards
      side.spikes = 0;
      side.isSR = false; // SR = Stealth Rocks
    });
  }

  const allPlayerSides = (allPlayers || [player, opponent])?.map((p) => p?.side) || [];

  // check for Ruin abilities from active Pokemon on the field (gen 9)
  // (ability counts are set in sanitizeField, so ignore processing if they're all 0)
  const hasActiveRuin = ruinAbilitiesActive(...allPlayerSides);

  // update (2023/01/30): @smogon/calc now implemented the Ruin effects if the Pokemon has them
  // (before they did nothing), so we don't need to rely on these field toggles if not Doubles
  // (more processing, such as Ruin abilities canceling each other out, is done in createSmogonPokemon(), btw)
  // const doubles = processedField.gameType === 'Doubles';

  // note that this will apply for the playerPokemon only to calculate the current matchup
  // (specifically the playerPokemon's playerMove in calcSmogonMatchup())
  if (hasActiveRuin && gameType === 'Doubles') {
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
