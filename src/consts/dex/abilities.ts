import { type AbilityName, type GameType } from '@smogon/calc';

/**
 * Abilities that can be forcibly toggled on/off by reporting its ability as *Pressure* when "off."
 *
 * * When toggled "off," the Pokémon's ability is reported as *Pressure* in `createSmogonPokemon()`,
 *   which has no effect in damage calculations.
 * * This is primarily to circumvent some of the "features" of `@smogon/calc` when these abilities are set,
 *   which may cause duplicate stat boosts when Showdown also reports the same.
 *
 * @since 1.1.7
 */
export const PokemonPseudoToggleAbilities: AbilityName[] = [
  'Libero', // if enabled, will apply STAB to all damaging moves (disabled = STAB for changed type only)
  'Multiscale', // special case based off the HP, but specified here to allow toggling in the UI
  'Protean', // if enabled, will apply STAB to all damaging moves (disabled = STAB for changed type only)
  'Protosynthesis', // introduced gen 9
  'Quark Drive', // introduced gen 9
  'Shadow Shield', // basically another multiscale lmao
] as AbilityName[];

/**
 * Abilities that ruined me.
 *
 * * Note: Doesn't end in `-ToggleAbilities` cause it's just a list of *Ruin* abilities.
 *   - Although, it is used to construct `PokemonToggleAbilities`!
 *
 * @since 1.1.7
 */
export const PokemonRuinAbilities: AbilityName[] = [
  'Beads of Ruin',
  'Sword of Ruin',
  'Tablets of Ruin',
  'Vessel of Ruin',
] as AbilityName[];

/**
 * Abilities with secondary passive effects that apply for just having the ability.
 *
 * * Also includes abilities that don't affect damages until activated, so we don't have to use the *Pressure* trick.
 * * Originally derived from `src/js/shared_controls.js` in `smogon/damage-calc`.
 *
 * @see https://github.com/smogon/damage-calc/blob/d8954f165c0dad5e2520c06bfb6313fee9ae6260/src/js/shared_controls.js#L258
 * @since 0.1.2
 */
export const PokemonPassiveToggleAbilities: AbilityName[] = [
  'Flash Fire', // Fire immunity always applies; Fire-type boost applies when toggled on
  // 'Intimidate', // applies the ATK reduction within `boosts`, so no need to "toggle" this
  'Minus',
  'Plus',
  'Slow Start',
  'Stakeout',
  'Unburden',
] as AbilityName[];

/**
 * Abilities that can be toggled on/off, separated by `GameType`.
 *
 * * What this used to be pre-v1.1.7 is now `PokemonPassiveToggleAbilities[]`.
 *  - This was to fix *Flash Fire* cause having both pseudo & passive abilities resort to the *Pressure* trick broke it.
 *
 * @since 1.1.7
 */
export const PokemonToggleAbilities: Record<GameType, AbilityName[]> = {
  Singles: [
    ...PokemonPseudoToggleAbilities,
    ...PokemonPassiveToggleAbilities,
  ],

  Doubles: [
    ...PokemonPseudoToggleAbilities,
    ...PokemonRuinAbilities,
    ...PokemonPseudoToggleAbilities,
  ],
};
