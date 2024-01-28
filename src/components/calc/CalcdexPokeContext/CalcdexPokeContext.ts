import * as React from 'react';
import { type AbilityName, type ItemName, type MoveName } from '@smogon/calc';
import {
  type CalcdexPlayer,
  type CalcdexPlayerKey,
  type CalcdexPokemon,
  type CalcdexPokemonPreset,
  type CalcdexPokemonUsageAlt,
} from '@showdex/interfaces/calc';
import { type CalcdexMatchupResult } from '@showdex/utils/calc';
import { type CalcdexPokemonUsageAltSorter } from '@showdex/utils/presets';
import { type CalcdexContextValue } from '../CalcdexContext';

/**
 * Stored properties for a specific Pokemon that's consumable by any Context Consumer.
 *
 * * ~~Note that the `attackerSide` and `defenderSide` properties in `state.field`
 *   may be swapped depending on the passed-in `playerKey` when initializing the Context.~~
 *   - ~~Swapped properties only pertain to this Context only (i.e., Redux state will be left untouched).~~
 * * As part of the great `CalcdexContext` refactor in v1.1.7 (which is funny cause that itself was from a refactor),
 *   all the abstracted dispatchers have been moved to the `useCalcdexPokemonConsumer()` hook.
 *   - Preset-stuff has been moved to `CalcdexPokePresetContext`.
 *
 * @since 1.1.1
 */
export interface CalcdexPokeContextValue extends Omit<CalcdexContextValue, 'presets'> {
  playerKey: CalcdexPlayerKey;
  player: CalcdexPlayer;
  playerPokemon: CalcdexPokemon;
  opponent: CalcdexPlayer;
  opponentPokemon: CalcdexPokemon;
  presetsLoading: boolean;
  allUsages: CalcdexPokemonPreset[]; // for all Pokemon, used by buildFormeOptions() in the Honkdex
  presets: CalcdexPokemonPreset[];
  usages: CalcdexPokemonPreset[];
  usage: CalcdexPokemonPreset;
  abilityUsageFinder: (value: AbilityName) => string;
  abilityUsageSorter: CalcdexPokemonUsageAltSorter<AbilityName>;
  itemUsageFinder: (value: ItemName) => string;
  itemUsageSorter: CalcdexPokemonUsageAltSorter<ItemName>;
  moveUsageFinder: (value: MoveName) => string;
  moveUsageSorter: CalcdexPokemonUsageAltSorter<MoveName>;
  formatLabelMap: Record<string, string>;
  formeUsages: CalcdexPokemonUsageAlt<string>[];
  formeUsageFinder: (value: string) => string;
  formeUsageSorter: CalcdexPokemonUsageAltSorter<string>;
  matchups: CalcdexMatchupResult[];
}

/**
 * Context that contains consumables for a specific Pokemon.
 *
 * * ~~Typically initialized in `PokeCalc` for use in `PokeInfo`, `PokeMoves`, and `PokeStats`.~~
 *
 * @since 1.1.1
 */
export const CalcdexPokeContext = React.createContext<CalcdexPokeContextValue>({
  state: {} as CalcdexPokeContextValue['state'],
  settings: {} as CalcdexPokeContextValue['settings'],
  saving: [false, () => void 0],

  playerKey: null,
  player: {} as CalcdexPlayer,
  playerPokemon: {} as CalcdexPokemon,
  opponent: {} as CalcdexPlayer,
  opponentPokemon: {} as CalcdexPokemon,

  presetsLoading: false,
  allUsages: [],
  presets: [],
  usages: [],
  usage: {} as CalcdexPokemonPreset,
  abilityUsageFinder: () => null,
  abilityUsageSorter: () => 0,
  itemUsageFinder: () => null,
  itemUsageSorter: () => 0,
  moveUsageFinder: () => null,
  moveUsageSorter: () => 0,
  formatLabelMap: {},
  formeUsages: [],
  formeUsageFinder: () => null,
  formeUsageSorter: () => 0,

  matchups: [],
});
