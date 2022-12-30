import * as React from 'react';
import type { AbilityName, ItemName, MoveName } from '@smogon/calc/dist/data/interface';
import type {
  CalcdexBattleField,
  CalcdexBattleState,
  CalcdexPlayer,
  CalcdexPlayerKey,
  CalcdexPokemon,
  CalcdexPokemonPreset,
  ShowdexCalcdexSettings,
} from '@showdex/redux/store';
import type {
  CalcdexPokemonAbilityOption,
  CalcdexPokemonItemOption,
  CalcdexPokemonMoveOption,
  CalcdexPokemonPresetOption,
  CalcdexPokemonUsageAltSorter,
} from '@showdex/utils/battle';
import type { CalcdexMatchupResult } from '@showdex/utils/calc';
import type { CalcdexBattleFieldMutation, CalcdexPokemonMutation } from './CalcdexContext';
// import type { SmogonMatchupHookCalculator } from './useSmogonMatchup';

/**
 * Stored properties for a specific Pokemon that's consumable by any Context Consumer.
 *
 * * ~~Note that the `attackerSide` and `defenderSide` properties in `state.field`
 *   may be swapped depending on the passed-in `playerKey` when initializing the Context.~~
 *   - ~~Swapped properties only pertain to this Context only (i.e., Redux state will be left untouched).~~
 *
 * @since 1.1.1
 */
export interface CalcdexPokeContextConsumables {
  state: CalcdexBattleState;
  settings: ShowdexCalcdexSettings;

  playerKey: CalcdexPlayerKey;
  player: CalcdexPlayer;
  playerPokemon: CalcdexPokemon;
  opponent: CalcdexPlayer;
  opponentPokemon: CalcdexPokemon;
  field: CalcdexBattleField;

  presetsLoading: boolean;
  presets: CalcdexPokemonPreset[];
  usages: CalcdexPokemonPreset[];
  usage: CalcdexPokemonPreset;

  abilityOptions: CalcdexPokemonAbilityOption[];
  itemOptions: CalcdexPokemonItemOption[];
  moveOptions: CalcdexPokemonMoveOption[];
  presetOptions: CalcdexPokemonPresetOption[];

  matchups: CalcdexMatchupResult[];

  sortAbilitiesByUsage: CalcdexPokemonUsageAltSorter<AbilityName>;
  sortItemsByUsage: CalcdexPokemonUsageAltSorter<ItemName>;
  sortMovesByUsage: CalcdexPokemonUsageAltSorter<MoveName>;

  applyPreset: (preset: CalcdexPokemonPreset | string, additionalMutations?: CalcdexPokemonMutation) => void;

  updatePokemon: (pokemon: CalcdexPokemonMutation) => void;
  updateField: (field: CalcdexBattleFieldMutation) => void;
  setActiveIndex: (index: number) => void;
  setActiveIndices: (indices: number[]) => void;
  setSelectionIndex: (index: number) => void;
  setAutoSelect: (autoSelect: boolean) => void;
}

/**
 * Context that contains consumables for a specific Pokemon.
 *
 * * Typically initialized in `PokeCalc` for use in `PokeInfo`, `PokeMoves`, and `PokeStats`.
 *
 * @since 1.1.1
 */
export const CalcdexPokeContext = React.createContext<CalcdexPokeContextConsumables>(null);
