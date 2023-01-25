import * as React from 'react';
import type {
  CalcdexBattleField,
  CalcdexBattleState,
  CalcdexPlayerKey,
  CalcdexPlayerSide,
  CalcdexPokemon,
  CalcdexRenderMode,
  ShowdexCalcdexSettings,
} from '@showdex/redux/store';

export type CalcdexPokemonMutation = DeepPartial<CalcdexPokemon>;
export type CalcdexPlayerSideMutation = DeepPartial<CalcdexPlayerSide>;
export type CalcdexBattleFieldMutation = DeepPartial<CalcdexBattleField>;

/**
 * Stored properties in the Calcdex Context that's consumable by any Context Consumer.
 *
 * @since 1.1.1
 */
export interface CalcdexContextConsumables {
  state: CalcdexBattleState;
  settings: ShowdexCalcdexSettings;

  renderMode: CalcdexRenderMode;
  shouldRender: boolean;

  updatePokemon: (playerKey: CalcdexPlayerKey, pokemon: CalcdexPokemonMutation) => void;
  updateSide: (playerKey: CalcdexPlayerKey, side: CalcdexPlayerSideMutation) => void;
  updateField: (field: CalcdexBattleFieldMutation) => void;
  setActiveIndex: (playerKey: CalcdexPlayerKey, index: number) => void;
  setActiveIndices: (playerKey: CalcdexPlayerKey, indices: number[]) => void;
  setSelectionIndex: (playerKey: CalcdexPlayerKey, index: number) => void;
  setAutoSelect: (playerKey: CalcdexPlayerKey, autoSelect: boolean) => void;
}

export const CalcdexContext = React.createContext<CalcdexContextConsumables>(null);
