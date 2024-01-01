import { type AbilityName, type ItemName } from '@smogon/calc';
import { type CalcdexBattleField, type CalcdexPokemon } from '@showdex/interfaces/calc';

/**
 * Determines if the provided `pokemon` is considered *grounded*, so it should lose computer privileges for a month
 * cause it's been a *Naughty* Pokemon.
 *
 * * That was a joke, of course.
 *   - (a really bad one at that)
 * * Actual purpose is to determine the `pokemon`'s grounded state, so Ground type moves can affect it, among other things.
 *   - tl;dr: vulnerability Ground type moves & affected by terrain + *Arena Trap*.
 *   - While Flying type Pokemon are considered *ungrounded*, they don't necessarily lose their Flying type when they
 *     are *grounded* (*Roost*-ing explicitly removes the Flying type, which in effect makes them *grounded*).
 *   - For our purposes, this is used to determine whether the type change & BP boost effects of the move *Terrain Pulse*
 *     should apply as a precondition is that the Pokemon be *grounded*.
 *   - When *ungrounded*, the Pokemon doesn't succumb to any effects of the terrain, including benefitial ones.
 * * Bulbapedia article on the *grounded* property explains it best:
 *   - "By default, grounded Pokemon are simply those that are not ungrounded."
 *   - ah yes of course
 *   - *the floor is made out of floor*
 * * ok but actually that basically means to be considered *grounded*, you have to be initially *ungrounded*.
 *   - That means not all Pokemon are eligible, since not all Pokemon are initially *ungrounded*.
 *   - There are several qualifications to be considered *ungrounded*, which this function determines as an intermediary
 *     step before returning the negation of it.
 * * What that also means is that *most* Pokemon are probably *grounded*, so this will more often than not return `true`.
 * * `null` will be returned if detection fails for whatever reason.
 *   - If you only want to know when the Pokemon is *ungrounded*, you can use the nullish coalescing operator (i.e., `??`)
 *     to fallback to `true`.
 *   - e.g., `const grounded = detectGroundedness(pokemon, field) ?? true`
 * * To summarize:
 *   - `true` means the `pokemon` is *grounded* (most will be),
 *   - `false` means the `pokemon` is *ungrounded* &
 *   - `null` means the big uh oh happened.
 *
 * @see https://bulbapedia.bulbagarden.net/wiki/Grounded
 * @see https://github.com/smogon/damage-calc/blob/bda7c94c95058f581699ae3ff5dc6bd5bdf9217e/calc/src/mechanics/util.ts#L30-L35
 * @since 1.2.0
 */
export const detectGroundedness = (
  pokemon: CalcdexPokemon,
  field?: CalcdexBattleField,
): boolean => {
  if (!pokemon?.speciesForme) {
    return null;
  }

  const {
    types: currentTypes,
    dirtyTypes,
    teraType: revealedTeraType,
    dirtyTeraType,
    terastallized,
    ability: revealedAbility,
    dirtyAbility,
    item: revealedItem,
    dirtyItem,
    volatiles: volatileMap,
  } = pokemon;

  const types = (!!dirtyTypes?.length && dirtyTypes) || (!!currentTypes?.length && currentTypes) || [];
  const teraType = dirtyTeraType || revealedTeraType;
  const ability = dirtyAbility || revealedAbility;
  const item = dirtyItem ?? revealedItem;
  const volatiles = Object.keys(volatileMap || {}) as Showdown.PokemonVolatile[];

  const ungrounded = types.includes('Flying')
    || (terastallized && teraType === 'Flying')
    || ability === 'Levitate' as AbilityName
    || item === 'Air Balloon' as ItemName
    || volatiles.includes('airballoon')
    || volatiles.includes('magnetrise')
    || volatiles.includes('telekinesis');

  if (!ungrounded) {
    return true;
  }

  // at this point, the Pokemon is able to be ungrounded, so now see if it actually is
  // (note: missing is the effect of Thousand Arrows, one of Zygarde's signature moves, which idk how to check for atm)
  const grounded = item === 'Iron Ball' as ItemName
    || volatiles.includes('ingrain')
    || volatiles.includes('smackdown')
    || field?.isGravity;

  return grounded;
};
