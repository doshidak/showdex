import { type AbilityName, type GameType } from '@smogon/calc';

/**
 * Abilities that activate when the Pokemon is at full "health" (i.e., max hit points, 100% HP).
 *
 * * Why isn't *Sturdy* in here?
 *   - idk, initially started with just *Multiscale* lol
 *   - so I guess this is technically a list of *Sturdy*-like abilities that reduce incoming damages when at 100%?
 *   - also, *Sturdy* would just affect the NHKO (but not the damage) by adding 1 more hit before KO no ? lol
 *   - or I suppose it caps the maximum final damage at the max HP – 1, so you'd be left with 1 HP at the very least,
 *     so inherently N+1HKO ... yeess o_O
 * * ... but but but why is this called `Pokemon`**`Sturdy`**`Abilities[]` then ???
 *   - ¯\\\_(ツ)_/¯
 *
 * @since 1.1.7
 */
export const PokemonSturdyAbilities: AbilityName[] = [
  'Multiscale', // special case based off the HP, but specified here to allow toggling in the UI
  'Shadow Shield', // basically another multiscale lmao
] as AbilityName[];

/**
 * Abilities that cause the Pokemon's type to change to the type of the move that it's about to use.
 *
 * * HUH
 *
 * @since 1.1.7
 */
export const PokemonTypeChangeAbilities: AbilityName[] = [
  'Libero', // if enabled, will apply STAB to all damaging moves (disabled = STAB for changed type only)
  'Protean', // if enabled, will apply STAB to all damaging moves (disabled = STAB for changed type only)
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
 * Abilities that boost your Elo.
 *
 * * Just kidding, they're abilities that can be activated by the *Booster Energy* item introduced in gen 9.
 *   - Technically just 2: *Protosynthesis* & *Quark Drive* ... for now :o
 *
 * @since 1.1.7
 */
export const PokemonBoosterAbilities: AbilityName[] = [
  'Protosynthesis',
  'Quark Drive',
] as AbilityName[];

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
  ...PokemonSturdyAbilities,
  ...PokemonTypeChangeAbilities,
  ...PokemonBoosterAbilities,
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
    ...PokemonPassiveToggleAbilities,
  ],
};

/**
 * Abilities that "skin" (i.e., override) the default types of a Pokemon's moves.
 *
 * * Strange name comes from the words *peau* (French), *sukin* (Japanese) & *seukin* (Korean) used in the non-English
 *   counterparts, such as for *Pixilate*:
 *   - *peau feerique* (French)
 *   - *fearii-sukin* (Japanese)
 *   - *peuri-seukin* (Korean)
 * * Couldn't think of a better name, sorry.
 * * Update (2024/01/04): Apparently these are called "ate" abilities in `@smogon/calc`'s `gen789.ts` mechanics file,
 *   which I initially saw awhile back & was like wait Pokemon can *eat* abilities ????????
 *   - I suppose the *Commander* ability kinda counts LOL
 *
 * @since 1.2.0
 */
export const PokemonMoveSkinAbilities: Record<AbilityName, Showdown.TypeName> = {
  Aerilate: 'Flying',
  Galvanize: 'Electric',
  Normalize: 'Normal',
  Pixilate: 'Fairy',
  Refrigerate: 'Ice',
} as Record<AbilityName, Showdown.TypeName>;
