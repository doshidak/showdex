import { type GenerationNum } from '@smogon/calc';
import { type CalcdexPlayer, type CalcdexPlayerSide } from '@showdex/redux/store';
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
    // activeIndex,
    activeIndices,
    selectionIndex,
    pokemon: playerPokemon,
    side,
  } = player || {};

  const activePokemon = activeIndices
    ?.map((i) => i > -1 && playerPokemon?.[i])
    .filter(Boolean);

  // obtain the "active" Pokemon by using the selectionIndex to properly apply the screens in
  // gen 1 (since they're directly applied to the Pokemon as a volatile) or using the activeIndicies
  // in gens 2+ to make sure stage hazards only apply for non-active Pokemon (otherwise, they'd be
  // always affecting the damage ranges!)
  // (note that these indices serve different purposes in gen 1 and in gens 2+)
  // const currentPokemon = playerPokemon?.length
  //   ? gen === 1 && selectionIndex > -1
  //     ? playerPokemon[selectionIndex]
  //     : gen > 1 && activeIndex > -1
  //       ? playerPokemon[activeIndex]
  //       : null
  //   : null;
  const currentPokemon = gen === 1 && playerPokemon?.length && selectionIndex > -1
    ? playerPokemon[selectionIndex]
    : null;

  const sideConditions = battleSide?.sideConditions || side?.conditions || {};
  const sideConditionNames = Object.keys(sideConditions)
    .map((c) => formatId(c))
    .filter(Boolean);

  // const volatileNames = (
  //   currentPokemon?.volatiles
  //     ? Object.keys(currentPokemon.volatiles || {})
  //     : activePokemon?.flatMap((p) => Object.keys(p?.volatiles || {}))
  // )?.map((v) => formatId(v)).filter(Boolean) ?? [];

  const volatileNames = Object.keys(currentPokemon?.volatiles || {})
    .map((v) => formatId(v))
    .filter(Boolean);

  const turnStatusNames = activePokemon
    ?.flatMap((p) => Object.keys(p?.turnstatuses || {})
      .map((s) => formatId(s))
      .filter(Boolean))
    ?? [];

  // check whether we should apply any Spikes and Stealth Rocks
  // update (2023/02/04): we're now doing this in createSmogonField() instead
  // const applyFieldHazards = gen > 1
  //   // && !!currentPokemon?.speciesForme // no reason to check this lol
  //   && selectionIndex > -1
  //   // && activeIndex !== selectionIndex;
  //   && !activeIndices.includes(selectionIndex);

  // l.debug(
  //   'Sanitizing side for player', player?.sideid || 'p?', player?.name || '???',
  //   '\n', 'gen', gen, 'activeIndices', activeIndices, 'selectionIndex', selectionIndex,
  //   '\n', 'currentPokemon', currentPokemon,
  //   // ...(gen > 1 ? ['\n', 'applyFieldHazards?', applyFieldHazards] : []),
  // );

  // count how many Pokemon have an activated Ruin ability (gen 9)
  // const activeRuinAbilities = playerPokemon
  //   ?.filter((p) => formatId(p?.dirtyAbility || p?.ability)?.endsWith('ofruin') && p.abilityToggled)
  //   .map((p) => formatId(p.dirtyAbility || p.ability))
  //   || [];

  return {
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
    // isProtected: null,

    // isSeeded: null,
    isForesight: volatileNames.includes('foresight'),
    isTailwind: sideConditionNames.includes('tailwind'),
    isHelpingHand: turnStatusNames.includes('helpinghand'),
    isFlowerGift: turnStatusNames.includes('flowergift'), // not sure if Showdown has Flower Gift in pokemon.turnstatuses
    // isFriendGuard: turnStatusNames.includes('friendguard'), // can't find in battle.js
    // isBattery: null,
    // isPowerSpot: null,

    isFirePledge: sideConditionNames.includes('firepledge'),
    isGrassPledge: sideConditionNames.includes('grasspledge'),
    isWaterPledge: sideConditionNames.includes('waterpledge'),

    // update (2023/02/01): now returned by countSideRuinAbilities()
    // ruinBeadsCount: activeRuinAbilities.filter((a) => a === 'beadsofruin').length,
    // ruinSwordCount: activeRuinAbilities.filter((a) => a === 'swordofruin').length,
    // ruinTabletsCount: activeRuinAbilities.filter((a) => a === 'tabletsofruin').length,
    // ruinVesselCount: activeRuinAbilities.filter((a) => a === 'vesselofruin').length,

    ...(gen > 8 && countSideRuinAbilities(player)),

    // isSwitching: player?.active?.[0]?.ident === player?.pokemon?.[activeIndex]?.ident ? 'out' : 'in',
  };
};
