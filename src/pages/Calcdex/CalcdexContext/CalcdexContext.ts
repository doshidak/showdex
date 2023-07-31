import * as React from 'react';
import {
  type CalcdexBattleField,
  type CalcdexBattleState,
  type CalcdexPlayerKey,
  type CalcdexPlayerSide,
  type CalcdexPokemon,
  // type CalcdexRenderMode,
  type ShowdexCalcdexSettings,
} from '@showdex/redux/store';

export type CalcdexPokemonMutation = DeepPartial<CalcdexPokemon>;
export type CalcdexPlayerSideMutation = DeepPartial<CalcdexPlayerSide>;
export type CalcdexBattleFieldMutation = DeepPartial<CalcdexBattleField>;

/**
 * Stored properties in the Calcdex Context that's consumable by any Context Consumer.
 *
 * * Dear future me: Sorry about the `scope` args I added in v1.1.3.
 *   - (And if it wasn't a problem, you're welcome.)
 *
 * @since 1.1.1
 */
export interface CalcdexContextConsumables {
  state: CalcdexBattleState;
  settings: ShowdexCalcdexSettings;

  // renderMode: CalcdexRenderMode;
  // shouldRender: boolean;

  updatePokemon: (playerKey: CalcdexPlayerKey, pokemon: CalcdexPokemonMutation, scope?: string) => void;
  updateSide: (playerKey: CalcdexPlayerKey, side: CalcdexPlayerSideMutation, scope?: string) => void;
  updateField: (field: CalcdexBattleFieldMutation, scope?: string) => void;
  setActiveIndex: (playerKey: CalcdexPlayerKey, index: number, scope?: string) => void;
  setActiveIndices: (playerKey: CalcdexPlayerKey, indices: number[], scope?: string) => void;
  setSelectionIndex: (playerKey: CalcdexPlayerKey, index: number, scope?: string) => void;
  setAutoSelect: (playerKey: CalcdexPlayerKey, autoSelect: boolean, scope?: string) => void;
  setPlayerKey: (playerKey: CalcdexPlayerKey, scope?: string) => void;
  setOpponentKey: (opponentKey: CalcdexPlayerKey, scope?: string) => void;
}

export const CalcdexContext = React.createContext<CalcdexContextConsumables>(null);
