import { formatId } from '@showdex/utils/app';
import { logger } from '@showdex/utils/debug';
import type { GenerationNum } from '@smogon/calc';
import type { CalcdexPlayer, CalcdexPlayerSide } from '@showdex/redux/store';

const l = logger('@showdex/utils/battle/sanitizePlayerSide');

/**
 * Sanitizes a player side (e.g., `p1`, `p2`, etc.) from the `battle` state.
 *
 * * Omits reporting *Spikes* and *Stealth Rocks* for active Pokemon already out on the field.
 *   - Active Pokemon is determined by the `activeIndices` in the `player.pokemon` array, if provided.
 *   - Otherwise, defaults to using the `active` array from the provided `battleSide`.
 *
 * @since 0.1.0
 */
export const sanitizePlayerSide = (
  gen: GenerationNum,
  battleSide: Showdown.Side,
  player?: Partial<CalcdexPlayer>,
): CalcdexPlayerSide => {
  const {
    active: activePokemon,
    sideConditions,
  } = battleSide || {};

  const {
    // activeIndex,
    activeIndices,
    selectionIndex,
    pokemon: playerPokemon,
  } = player || {};

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

  const sideConditionNames = Object.keys(sideConditions || {})
    .map((c) => formatId(c))
    .filter(Boolean);

  const volatileNames = (
    currentPokemon?.volatiles
      ? Object.keys(currentPokemon.volatiles || {})
      : activePokemon?.flatMap((p) => Object.keys(p?.volatiles || {}))
  )?.map((v) => formatId(v)).filter(Boolean) ?? [];

  const turnStatusNames = activePokemon
    ?.flatMap((p) => Object.keys(p?.turnstatuses || {}).map((s) => formatId(s)).filter(Boolean))
    ?? [];

  // check whether we should apply any Spikes and Stealth Rocks
  const applyFieldHazards = gen > 1
    // && !!currentPokemon?.speciesForme // no reason to check this lol
    && selectionIndex > -1
    // && activeIndex !== selectionIndex;
    && !activeIndices.includes(selectionIndex);

  l.debug(
    'Sanitizing side for player', player?.sideid || 'p?', player?.name || '???',
    '\n', 'gen', gen, 'activeIndices', activeIndices, 'selectionIndex', selectionIndex,
    '\n', 'currentPokemon', currentPokemon,
    ...(gen > 1 ? ['\n', 'applyFieldHazards?', applyFieldHazards] : []),
  );

  return {
    // conditionally remove Spikes & Stealth Rocks from the calc if the Pokemon is
    // already on the field (don't want the hazard damage to re-apply)
    spikes: applyFieldHazards && sideConditionNames.includes('spikes') ? sideConditions.spikes?.[1] ?? 0 : 0,
    isSR: applyFieldHazards && sideConditionNames.includes('stealthrock'),

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
    // isFriendGuard: turnStatusNames.includes('friendguard'), // can't find in battle.js
    // isBattery: null,
    // isPowerSpot: null,

    isFirePledge: sideConditionNames.includes('firepledge'),
    isGrassPledge: sideConditionNames.includes('grasspledge'),
    isWaterPledge: sideConditionNames.includes('waterpledge'),

    // isSwitching: player?.active?.[0]?.ident === player?.pokemon?.[activeIndex]?.ident ? 'out' : 'in',
  };
};
