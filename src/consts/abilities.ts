import type { AbilityName } from '@pkmn/data';

/**
 * Abilities that can be toggled on/off.
 *
 * * Originally derived from `src/js/shared_controls.js` in `smogon/damage-calc`.
 *
 * @see https://github.com/smogon/damage-calc/blob/master/src/js/shared_controls.js#L215
 * @since 0.1.2
 */
export const PokemonToggleAbilities: AbilityName[] = [
  <AbilityName> 'Flash Fire',
  <AbilityName> 'Intimidate',
  <AbilityName> 'Minus',
  <AbilityName> 'Multiscale',
  <AbilityName> 'Plus',
  <AbilityName> 'Slow Start',
  <AbilityName> 'Stakeout',
  <AbilityName> 'Unburden',
];
