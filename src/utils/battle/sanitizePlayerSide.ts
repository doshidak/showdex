import type { CalcdexPlayerSide } from '@showdex/redux/store';

export const sanitizePlayerSide = (
  player: Showdown.Side,
  activeIndex = 0,
): CalcdexPlayerSide => {
  const sideConditionNames = Object.keys(player?.sideConditions || {}) as Showdown.SideConditionName[];
  const volatileNames = Object.keys(player?.active?.[activeIndex]?.volatiles || {}) as Showdown.PokemonVolatile[];
  const turnStatusNames = Object.keys(player?.active?.[activeIndex]?.turnstatuses || {}) as Showdown.PokemonTurnStatus[];

  return {
    spikes: sideConditionNames.includes('spikes') ? player.sideConditions.spikes?.[1] : 0,
    steelsurge: sideConditionNames.includes('gmaxsteelsurge'),
    vinelash: sideConditionNames.includes('gmaxvinelash'),
    wildfire: sideConditionNames.includes('gmaxwildfire'),
    cannonade: sideConditionNames.includes('gmaxcannonade'),
    volcalith: sideConditionNames.includes('gmaxvolcalith'),
    isReflect: sideConditionNames.includes('reflect'),
    isLightScreen: sideConditionNames.includes('lightscreen'),
    // isProtected: null,
    // isSeeded: null,
    isForesight: volatileNames.includes('foresight'),
    isTailwind: sideConditionNames.includes('tailwind'),
    isHelpingHand: turnStatusNames.includes('helpinghand'),
    // isFriendGuard: turnStatusNames.includes('friendguard'), // can't find in battle.js
    isAuroraVeil: sideConditionNames.includes('auroraveil'),
    // isBattery: null,
    // isPowerSpot: null,
    isFirePledge: sideConditionNames.includes('firepledge'),
    isGrassPledge: sideConditionNames.includes('grasspledge'),
    isWaterPledge: sideConditionNames.includes('waterpledge'),
    // isSwitching: player?.active?.[0]?.ident === player?.active?.[activeIndex]?.ident ? 'out' : 'in',
    isSwitching: null,
  };
};
