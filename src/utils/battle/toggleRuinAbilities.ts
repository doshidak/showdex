import { type GameType } from '@smogon/calc';
import { PokemonRuinAbilities } from '@showdex/consts/dex';
import { type CalcdexPlayer } from '@showdex/interfaces/calc';
// import { formatId } from '@showdex/utils/core';

/**
 * Auto-toggles each applicable Pokemon's `abilityToggled` if they have a *Ruin* ability.
 *
 * * Note that this will **directly** mutate the passed-in `player` object, hence the `void` for the return value.
 * * Providing the `selectionIndexOverride` argument will override the `selectionIndex` (wow!!) from the `player` when
 *   determining the user's currently selected Pokemon.
 * * `updateSelection` must be explicitly set to `true` for this utility to set the `abilityToggled` state for the
 *   Pokemon at the determined selection index (whether `selectionIndexOverride` or `player.selectionIndex`).
 *   - This argument is only used when `gameType` is `'Doubles'`.
 *   - i.e., Has no effect when `gameType` is `'Singles'` (default).
 *
 * @since 1.1.0
 */
export const toggleRuinAbilities = (
  player: CalcdexPlayer,
  gameType: GameType = 'Singles',
  updateSelection?: boolean,
  selectionIndexOverride?: number,
): void => {
  if (!player?.sideid || !player.pokemon?.length) {
    return;
  }

  // find all `pokemon` with a Ruin ability, whether activated or not
  const ruinPokemon = player.pokemon
    .filter((p) => PokemonRuinAbilities.includes(p?.dirtyAbility || p?.ability));

  if (!ruinPokemon.length) {
    return;
  }

  const selectionIndex = selectionIndexOverride ?? player.selectionIndex;
  const selectedPokemon = player.pokemon?.[selectionIndex];

  if (gameType === 'Singles' && !selectedPokemon?.calcdexId) {
    return;
  }

  const activeIds = gameType === 'Doubles'
    ? player.activeIndices?.length
      ? player.activeIndices.map((i) => player.pokemon[i]?.calcdexId).filter(Boolean)
      : (player.pokemon?.map((p) => (p?.active && p.calcdexId) || null).filter(Boolean) || [])
    : [];

  // for 'Singles', toggle off each ruinPokemon's Ruin ability if activated, except for the selectedPokemon
  // (UI shouldn't display the "ACTIVE" toggle in Singles for Ruin abilities)
  // for 'Doubles', toggle off each inactive ruinPokemon's Ruin ability if activated
  ruinPokemon.forEach((pokemon) => {
    pokemon.abilityToggled = gameType === 'Singles'
      ? pokemon.calcdexId === selectedPokemon.calcdexId
      : activeIds.includes(pokemon.calcdexId);
  });

  const shouldUpdateSelection = gameType === 'Doubles'
    && updateSelection
    && !!selectedPokemon?.calcdexId
    && PokemonRuinAbilities.includes(selectedPokemon.dirtyAbility || selectedPokemon.ability);

  if (!shouldUpdateSelection) {
    return;
  }

  // count how many Pokemon have an activated Ruin ability, whether active on the field or not
  // (but at this point, only active ruinPokemon should have abilityToggled as true)
  const activeRuinCount = ruinPokemon.filter((p) => p.abilityToggled).length;

  // in the case that both active Pokemon have activated Ruin abilities,
  // only allow the ability to be toggled on if one of the active Ruin abilities is deactivated
  if (activeRuinCount < 2) { // 2 for doubles
    selectedPokemon.abilityToggled = true;
  }
};
