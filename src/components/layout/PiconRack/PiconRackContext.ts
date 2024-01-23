import * as React from 'react';
import { type UniqueIdentifier } from '@dnd-kit/core';
import { type CalcdexPlayerKey } from '@showdex/interfaces/calc';
import { type GridSpecs } from '../RackGrid';

export type PiconRackPlayerOrdering = Record<CalcdexPlayerKey, string[]>;

export interface PiconRackContextValue extends PiconRackPlayerOrdering {
  itemKeyPrefix: string;
  containerIds: Record<CalcdexPlayerKey, string>;
  overlayId: string;
  lastAddedId: string;
  gridSpecs: GridSpecs;
  makeItemId: (playerKey: CalcdexPlayerKey, pokemonId: string) => string;
  extractPlayerKey: (itemId: UniqueIdentifier, detectOnly?: boolean) => CalcdexPlayerKey;
  extractPokemonId: (itemId: UniqueIdentifier) => string;
}

export const PiconRackContext = React.createContext<PiconRackContextValue>({
  itemKeyPrefix: null,

  containerIds: {
    p1: null,
    p2: null,
    p3: null,
    p4: null,
  },

  overlayId: null,
  lastAddedId: null,

  gridSpecs: {
    columns: 1,
    gridSize: 1,
    gridGap: 0,
  },

  p1: [],
  p2: [],
  p3: [],
  p4: [],

  makeItemId: () => null,
  extractPlayerKey: () => null,
  extractPokemonId: () => null,
});
