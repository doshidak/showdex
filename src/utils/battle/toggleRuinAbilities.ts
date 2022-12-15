import { formatId } from '@showdex/utils/app';
import type { GameType } from '@smogon/calc/dist/data/interface';
import type { CalcdexPlayer } from '@showdex/redux/store';

/**
 * Auto-toggles each applicable Pokemon's `abilityToggled` if they have a *Ruin* ability.
 *
 * * Note that this will **directly** mutate the passed-in `player` object,
 *   hence the `void` for the return value.
 * * Providing the `index` argument will override the `selectionIndex` from the `player`
 *   when determining the user's currently selected Pokemon.
 * * `updateSelection` must be explicitly set to `true` for this utility to set the
 *   `abilityToggled` state for the Pokemon at `index`.
 *   - This argument is only used when `gameType` is `'Doubles'`.
 *   - i.e., Has no effect when `gameType` is `'Singles'` (default).
 *
 * @since 1.1.0
 */
export const toggleRuinAbilities = (
  player: CalcdexPlayer,
  index?: number,
  gameType: GameType = 'Singles',
  updateSelection?: boolean,
): void => {
  if (!player?.sideid) {
    return;
  }

  const selectionIndex = index ?? player.selectionIndex;
  const selectedPokemon = player.pokemon?.[selectionIndex];
  const ability = formatId(selectedPokemon?.dirtyAbility || selectedPokemon?.ability);

  // if (!ability?.endsWith('ofruin')) {
  //   return;
  // }

  // find all `pokemon` with a Ruin ability, whether activated or not
  const ruinPokemon = player.pokemon
    .filter((p) => formatId(p?.dirtyAbility || p?.ability)?.endsWith('ofruin'));

  if (gameType === 'Singles') {
    // toggle off each ruinPokemon's Ruin ability if activated, except for the selectedPokemon
    // (UI shouldn't display the "ACTIVE" toggle in Singles for Ruin abilities)
    ruinPokemon.forEach((mon) => {
      mon.abilityToggled = mon.calcdexId === selectedPokemon.calcdexId;
    });

    return;
  }

  if (!updateSelection) {
    return;
  }

  // gameType = 'Doubles'
  // toggle off each inactive ruinPokemon's Ruin ability if activated
  ruinPokemon.forEach((mon) => {
    // if (!mon.abilityToggled) {
    //   return;
    // }

    const currentIndex = player.pokemon.findIndex((p) => p?.calcdexId === mon.calcdexId);

    // if (currentIndex > -1 && player.activeIndices.includes(currentIndex)) {
    //   return;
    // }

    // mon.abilityToggled = false;
    mon.abilityToggled = currentIndex > -1 && player.activeIndices.includes(currentIndex);
  });

  // count how many Pokemon have an activated Ruin ability, whether active on the field or not
  // (but at this point, only active ruinPokemon should have abilityToggled as true)
  const activeRuinCount = ruinPokemon.filter((p) => p.abilityToggled).length;

  // in the case that both active Pokemon have activated Ruin abilities,
  // only allow the ability to be toggled on if one of the active Ruin abilities is deactivated
  if (activeRuinCount < 2 && ability?.endsWith('ofruin')) { // 2 for doubles
    selectedPokemon.abilityToggled = true;
  }
};
