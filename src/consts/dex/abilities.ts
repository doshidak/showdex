import { type AbilityName } from '@smogon/calc';

/**
 * Abilities that can be toggled on/off.
 *
 * * Originally derived from `src/js/shared_controls.js` in `smogon/damage-calc`.
 *
 * @see https://github.com/smogon/damage-calc/blob/master/src/js/shared_controls.js#L215
 * @since 0.1.2
 */
export const PokemonToggleAbilities: AbilityName[] = [
  'Beads of Ruin',
  'Flash Fire',
  // 'Intimidate', // applies the ATK reduction within `boosts`, so no need to "toggle" this
  'Libero', // if enabled, will apply STAB to all damaging moves (disabled = STAB for changed type only)
  'Minus',
  'Multiscale', // special case based off the HP, but specified here to allow toggling in the UI
  'Plus',
  'Protean', // if enabled, will apply STAB to all damaging moves (disabled = STAB for changed type only)
  'Protosynthesis', // introduced gen 9
  'Quark Drive', // introduced gen 9
  'Shadow Shield', // basically another multiscale lmao
  'Slow Start',
  'Stakeout',
  'Sword of Ruin',
  'Tablets of Ruin',
  'Unburden',
  'Vessel of Ruin',
] as AbilityName[];
