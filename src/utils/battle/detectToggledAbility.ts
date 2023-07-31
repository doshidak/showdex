import { type CalcdexBattleState, type CalcdexPokemon } from '@showdex/redux/store';
import { calcPokemonHpPercentage } from '@showdex/utils/calc';
import { formatId } from '@showdex/utils/core';
import { toggleableAbility } from '@showdex/utils/dex';

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
 * * As of v1.1.0 when Gen 9 support was added, an optional `state` argument was added, which if provided,
 *   will be used in determining the toggle state for the following abilities:
 *   - *Beads of Ruin*
 *   - *Protosynthesis*
 *   - *Quark Drive*
 *   - *Sword of Ruin*
 *   - *Tablets of Ruin*
 *   - *Vessel of Ruin*
 *
 * @returns `true` if the Pokemon's ability is *toggleable* and *active*, `false` otherwise.
 * @since 0.1.2
 */
export const detectToggledAbility = (
  pokemon: DeepPartial<CalcdexPokemon> = {},
  state?: DeepPartial<CalcdexBattleState>,
): boolean => {
  if (!toggleableAbility(pokemon)) {
    return false;
  }

  const ability = formatId(pokemon.dirtyAbility || pokemon.ability);

  // by this point, the Pokemon's HP is 0% or 100% so Multiscale should be "on"
  // (considering that we "reset" the HP to 100% if the Pokemon is dead, i.e., at 0% HP)
  // (also note that Multiscale doesn't exist in pokemon.volatiles, hence the check here)
  if (['multiscale', 'shadowshield'].includes(ability)) {
    const hpPercentage = calcPokemonHpPercentage(pokemon);

    return !hpPercentage || hpPercentage === 1;
  }

  const volatilesKeys = Object.keys(pokemon.volatiles || {});

  // handle Slow Start
  if (ability === 'slowstart') {
    return volatilesKeys.includes('slowstart');
  }

  const item = formatId(pokemon.dirtyItem ?? pokemon.item);

  // handle Unburden
  if (ability === 'Unburden') {
    return !item || volatilesKeys.includes('itemremoved');
  }

  // handle type-change abilities (i.e., Protean & Libero)
  if (['protean', 'libero'].includes(ability)) {
    // idea is that if these abilities are enabled, then STAB will apply to all damaging moves;
    // otherwise, due to the handling of the 'typechange' volatile in createSmogonPokemon()
    // where the changed type is passed to @smogon/calc, only damaging moves of the changed type
    // will have STAB; additionally, when the user modifies the Pokemon's types via dirtyTypes[],
    // this should be toggled off as well, regardless of the 'typechange' volatile
    return !('typechange' in pokemon.volatiles)
      && !pokemon.dirtyTypes?.length;
  }

  // handle Ruin abilities
  // (note: smart Ruin ability toggling is done in setSelectionIndex() of useCalcdex())
  if (ability.endsWith('ofruin') && pokemon.playerKey && state?.[pokemon.playerKey]?.sideid) {
    const {
      activeIndices,
      selectionIndex,
      pokemon: pokemonState,
    } = state[pokemon.playerKey];

    // fuck it, just turn it on if state is uninitialized lol
    if (!pokemonState?.length) {
      return true;
    }

    const pokemonIndex = pokemonState
      ?.findIndex((p) => p?.calcdexId === pokemon.calcdexId)
      ?? -1;

    if (pokemonIndex < 0) {
      return false;
    }

    // only initially activate if the Pokemon is selected or active on the field
    if (state.field?.gameType === 'Singles') {
      return selectionIndex > -1 && pokemonIndex === selectionIndex;
    }

    return !!activeIndices?.length && activeIndices.includes(pokemonIndex);
  }

  // handle Protosynthesis/Quark Drive
  if (['protosynthesis', 'quarkdrive'].includes(ability)) {
    return item === 'boosterenergy'
      || (['Sun', 'Harsh Sunshine'].includes(state?.field?.weather) && ability === 'protosynthesis')
      || (state?.field?.terrain === 'Electric' && ability === 'quarkdrive')
      || volatilesKeys.some((k) => k?.startsWith(ability)); // e.g., 'protosynthesisatk' is a volatiles key
  }

  // last resort: look in the volatiles for the ability, maybe
  return volatilesKeys.some((k) => k?.includes(ability));
};
