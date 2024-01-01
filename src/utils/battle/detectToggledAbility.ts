import {
  type AbilityName,
  type GameType,
  type ItemName,
  type Terrain,
  type Weather,
} from '@smogon/calc';
import {
  PokemonBoosterAbilities,
  PokemonSturdyAbilities,
  PokemonRuinAbilities,
  PokemonTypeChangeAbilities,
} from '@showdex/consts/dex';
import { type CalcdexPokemon } from '@showdex/interfaces/calc';
import { calcPokemonHpPercentage } from '@showdex/utils/calc';
import { formatId } from '@showdex/utils/core';

/**
 * Determines whether the Pokemon's toggleable ability is active (if applicable).
 *
 * * Primarily depends on the Pokemon's `volatiles` object (from the `battle` state).
 *   - For instance, if Heatran's *Flash Fire* ability is activated, you'll see its `volatiles` object
 *     set to `{ flashfire: ['flashfire'] }` (at the time of writing this, of course).
 *   - Otherwise, its `ability` would still be `'Flash Fire'`, but `volatiles` would be an empty object, i.e., `{}`.
 * * Only exception is the *Multiscale* & *Shadow Shield* abilities, which is only active when the Pokemon's HP is at 100%.
 *   - Pokemon's HP value isn't currently editable, so there's no way to toggle *Multiscale* on/off
 *     (before the Pokemon takes any damage).
 *   - Additionally, if, say, Dragonite takes damage, this would return `false`, since its HP is no longer at 100%.
 *     In the case where Dragonite uses *Roost* and the opponent doesn't attack (e.g., switches out),
 *     resulting in Dragonite healing back to full health (i.e., 100%), this would return `true` again.
 * * As of v1.1.0 when Gen 9 support was added, ~~an optional `state` argument was added~~, which if provided,
 *   will be used in determining the toggle state for the following abilities:
 *   - *Beads of Ruin*
 *   - *Protosynthesis*
 *   - *Quark Drive*
 *   - *Sword of Ruin*
 *   - *Tablets of Ruin*
 *   - *Vessel of Ruin*
 * * As of v1.1.7, as to not depend on the big ass `state` argument, required parameters to determine the toggle state
 *   of the aforementioned gen 9 abilities can be individually supplied in the optional `config` argument.
 *   - For *Protosynthesis*, `weather` is required.
 *   - For *Quark Drive*, `terrain` is required.
 *   - For the 4 *Ruin* abilities, ~~`pokemonIndex` is required, as well as~~ `selectionIndex` if the `gameType` is `'Singles'`
 *     ~~& `activeIndices[]` if `'Doubles'`~~.
 * * Additionally as of v1.1.7, this no longer checks if the ability is toggleable via `toggleableAbility()`.
 *   - Since `abilityToggled` is used for counting *Ruin* abilities & isn't included in `PokemonToggleAbilities.Singles[]`
 *     (in order to prevent the "ACTIVE" toggle from appearing in `PokeInfo`), these two properties should be functionally distinct.
 *   - (Will probably rename `abilityToggled` to `abilityActive` or something later lol.)
 *   - Update (2023/10/18): Just made `abilityToggleable` deprecated for now & removed all usage of it from the codebase.
 * * Added optional `opponentPokemon` config cause *Stakeout* needs to know the `active` state of the opposing Pokemon.
 *   - Basically looking if the `opponentPokemon.active` is `false`, which assumes the user is trying to calculate
 *     *Stakeout* damage against a potential switch-in.
 *   - As a safety measure, `opponentPokemon` needs to be explicitly provided for this check to run, otherwise, `false`
 *     will be returned (i.e., how it was before *Stakeout* was implemented).
 *
 * @returns `true` if the Pokemon's ability is ~~*toggleable* and~~ *active*, `false` otherwise.
 * @todo rename to `detectToggledAbility()` to `activatedAbility()` whenever you rename `abilityToggled` to `abilityActive`.
 * @since 0.1.2
 */
export const detectToggledAbility = (
  pokemon: Partial<CalcdexPokemon>,
  config?: {
    gameType?: GameType,
    pokemonIndex?: number;
    opponentPokemon?: Partial<CalcdexPokemon>;
    selectionIndex?: number;
    activeIndices?: number[];
    weather?: Weather;
    terrain?: Terrain;
  },
): boolean => {
  const {
    gameType = 'Singles',
    pokemonIndex = pokemon?.slot ?? -1,
    opponentPokemon,
    selectionIndex = -1,
    activeIndices = [],
    weather,
    terrain,
  } = config || {};

  const ability = pokemon.dirtyAbility || pokemon.ability;

  // by this point, the Pokemon's HP is 0% or 100% so Multiscale should be "on"
  // (considering that we "reset" the HP to 100% if the Pokemon is dead, i.e., at 0% HP)
  // (also note that Multiscale doesn't exist in pokemon.volatiles, hence the check here)
  if (PokemonSturdyAbilities.includes(ability)) {
    const hpPercentage = calcPokemonHpPercentage(pokemon);

    return !hpPercentage || hpPercentage === 1;
  }

  const item = pokemon.dirtyItem ?? pokemon.item;
  const volatiles = Object.keys(pokemon.volatiles || {});

  // handle Slow Start
  if (ability === 'Slow Start' as AbilityName) {
    return volatiles.includes('slowstart');
  }

  // handle Unburden
  if (ability === 'Unburden' as AbilityName) {
    // only enable from volatile if the user explicitly didn't set an item
    return !pokemon.dirtyItem && volatiles.includes('itemremoved');
  }

  // handle Stakeout
  // (this assumes that the user is trying to calculate Stakeout against a potential switch-in, i.e., not `active`)
  if (ability === 'Stakeout' as AbilityName) {
    // double-checking speciesForme here to make sure `opponentPokemon` was **explicitly** provided
    // (otherwise, this would pretty much return `true` most of the time! would we want that? idk but I'm gunna assume naw)
    return !!opponentPokemon?.speciesForme && !opponentPokemon.active;
  }

  // handle type-change abilities (i.e., Protean & Libero)
  if (PokemonTypeChangeAbilities.includes(ability)) {
    // idea is that if these abilities are enabled, then STAB will apply to all damaging moves;
    // otherwise, due to the handling of the 'typechange' volatile in createSmogonPokemon()
    // where the changed type is passed to @smogon/calc, only damaging moves of the changed type
    // will have STAB; additionally, when the user modifies the Pokemon's types via dirtyTypes[],
    // this should be toggled off as well, regardless of the 'typechange' volatile
    return !volatiles.includes('typechange') && !pokemon.dirtyTypes?.length;
  }

  // handle Ruin abilities
  // (note: smart Ruin ability toggling is done in setSelectionIndex() of useCalcdex())
  if (PokemonRuinAbilities.includes(ability)) {
    // fuck it, just turn it on if config isn't provided lol
    if (pokemonIndex < 0) {
      return gameType === 'Singles' && selectionIndex < 0;
    }

    // only initially activate if the Pokemon is selected or active on the field
    return gameType === 'Doubles'
      ? (pokemon.active || activeIndices?.includes(pokemonIndex))
      : pokemonIndex === selectionIndex;
  }

  const abilityId = formatId(ability);

  // handle Protosynthesis/Quark Drive
  if (PokemonBoosterAbilities.includes(ability)) {
    return item === 'Booster Energy' as ItemName
      // || (ability === 'Protosynthesis' as AbilityName && (['Sun', 'Harsh Sunshine'] as Weather[]).includes(weather))
      || (ability === 'Protosynthesis' as AbilityName && weather === 'Sun' as Weather)
      || (ability === 'Quark Drive' as AbilityName && terrain === 'Electric' as Terrain)
      || volatiles.some((k) => k?.startsWith(abilityId)); // e.g., 'protosynthesisatk' is a volatiles key
  }

  // last resort: look in the volatiles for the ability, maybe
  return volatiles.some((k) => k?.includes(abilityId));
};
