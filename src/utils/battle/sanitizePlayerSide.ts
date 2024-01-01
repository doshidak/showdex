import { type GenerationNum } from '@smogon/calc';
import { type CalcdexPlayer, type CalcdexPlayerSide } from '@showdex/interfaces/calc';
import { formatId } from '@showdex/utils/core';
// import { logger } from '@showdex/utils/debug';
import { countSideRuinAbilities } from './countSideRuinAbilities';

// const l = logger('@showdex/utils/battle/sanitizePlayerSide()');

/**
 * Sanitizes a player side (e.g., `p1`, `p2`, etc.) from the `battle` state.
 *
 * * Omits reporting *Spikes* and *Stealth Rocks* for active Pokemon already out on the field.
 *   - Active Pokemon is determined by the `activeIndices` in the `player.pokemon` array.
 * * Providing `battleSide` will use its `sideConditions` over the one stored in `player`
 *   (under `player.side.conditions`), which is primarily useful in `syncBattle()`.
 *   - There are instances where the `battle` object may not be available, such as in the
 *     `CalcdexProvider` when recounting the *Ruin* abilities (gen 9), for instance.
 *
 * @todo Also, `sanitizePlayerSide()` is a terrible name for what this actually does.
 *   This returns a populated `CalcdexPlayerSide` for the provided `player` based on the selected
 *   and active Pokemon, which doesn't actually sanitize anything at all!
 * @since 0.1.0
 */
export const sanitizePlayerSide = (
  gen: GenerationNum,
  player: Partial<CalcdexPlayer>,
  battleSide?: Showdown.Side,
): CalcdexPlayerSide => {
  // const {
  //   // active: activePokemon,
  //   sideConditions,
  // } = battleSide || {};

  const {
    // activeIndices,
    selectionIndex,
    pokemon: playerPokemon,
    side,
  } = player || {};

  // const activePokemon = activeIndices
  //   ?.map((i) => i > -1 && playerPokemon?.[i])
  //   .filter(Boolean);

  // obtain the "active" Pokemon by using the selectionIndex to properly apply the screens in
  // gen 1 (since they're directly applied to the Pokemon as a volatile), otherwise don't bother
  const currentPokemon = gen === 1 && playerPokemon?.length && selectionIndex > -1
    ? playerPokemon[selectionIndex]
    : null;

  const sideConditions = battleSide?.sideConditions
    || side?.conditions
    || {};

  const sideConditionNames = Object.keys(sideConditions)
    .map((c) => formatId(c))
    .filter(Boolean);

  const volatileNames = Object.keys(currentPokemon?.volatiles || {})
    .map((v) => formatId(v))
    .filter(Boolean) as Showdown.PokemonVolatile[];

  // const turnStatusNames = activePokemon
  //   ?.flatMap((p) => Object.keys(p?.turnstatuses || {})
  //     .map((s) => formatId(s))
  //     .filter(Boolean))
  //   ?? [];

  const output: CalcdexPlayerSide = {
    // conditionally remove Spikes & Stealth Rocks from the calc if the Pokemon is
    // already on the field (don't want the hazard damage to re-apply)
    // update (2023/02/04): as part of the CalcdexPlayerSide refactoring, we're now conditionally removing
    // these in createSmogonField() instead. we want the actual values from the battle stored here!
    spikes: (sideConditionNames.includes('spikes') && sideConditions.spikes?.[1]) || 0,
    isSR: sideConditionNames.includes('stealthrock'),

    steelsurge: sideConditionNames.includes('gmaxsteelsurge'),
    vinelash: sideConditionNames.includes('gmaxvinelash'),
    wildfire: sideConditionNames.includes('gmaxwildfire'),
    cannonade: sideConditionNames.includes('gmaxcannonade'),
    volcalith: sideConditionNames.includes('gmaxvolcalith'),

    isReflect: (gen === 1 ? volatileNames : sideConditionNames).includes('reflect'),
    isLightScreen: (gen === 1 ? volatileNames : sideConditionNames).includes('lightscreen'),
    isAuroraVeil: sideConditionNames.includes('auroraveil'),
    isProtected: volatileNames.includes('protect'),

    isSeeded: volatileNames.includes('leechseed'),
    isForesight: volatileNames.includes('foresight'),
    isTailwind: sideConditionNames.includes('tailwind'),
    isHelpingHand: volatileNames.includes('helpinghand'),
    // isFlowerGift: null,
    // isFriendGuard: null,
    // isBattery: null,
    // isPowerSpot: null,

    isFirePledge: sideConditionNames.includes('firepledge'),
    isGrassPledge: sideConditionNames.includes('grasspledge'),
    isWaterPledge: sideConditionNames.includes('waterpledge'),

    ...(gen > 8 && countSideRuinAbilities(player)),

    isSwitching: currentPokemon?.active ? 'out' : 'in',
  };

  // l.debug(
  //   'Sanitized CalcdexPlayerSide for', player?.sideid || 'p?', player?.name || '???',
  //   '\n', 'gen', gen, 'activeIndices', activeIndices, 'selectionIndex', selectionIndex,
  //   '\n', 'player', player,
  //   '\n', 'sideConditionNames', sideConditionNames,
  //   ...(gen === 1 ? [
  //     '\n', 'currentPokemon', currentPokemon,
  //     '\n', 'volatileNames', volatileNames,
  //   ] : []),
  //   '\n', 'output', output,
  // );

  return output;
};
