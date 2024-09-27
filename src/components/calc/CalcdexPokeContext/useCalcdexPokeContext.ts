import * as React from 'react';
import { type CalcdexPokemon, type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
import { logger, runtimer } from '@showdex/utils/debug';
import { useCalcdexContext } from '../CalcdexContext';
import { type CalcdexPokeContextValue, CalcdexPokeContext } from './CalcdexPokeContext';

/**
 * Pokemon-specific Calcdex Context value with some abstracted dispatchers, available to Consumers of said Context.
 *
 * @since 1.1.7
 */
export interface CalcdexPokeContextConsumables extends CalcdexPokeContextValue {
  addPokemon: (
    pokemon: PickRequired<CalcdexPokemon, 'speciesForme'> | PickRequired<CalcdexPokemon, 'speciesForme'>[],
    scope?: string,
  ) => void;

  importPresets: (
    presets: CalcdexPokemonPreset[], // alwaysAdd = true -> will always add as new; otherwise, will only apply to ctx player's pokemon[]
    additionalMutations?: Record<string, Partial<CalcdexPokemon>>, // key = preset's calcdexId
    config?: {
      alwaysAdd?: boolean;
      onlyForId?: string;
    },
    scope?: string,
  ) => number; // returns # of successfully imported presets

  applyPreset: (
    presetOrId: CalcdexPokemonPreset | string,
    additionalMutations?: Partial<CalcdexPokemon>,
    scope?: string,
  ) => void;

  updatePokemon: (
    pokemon: Partial<CalcdexPokemon>,
    scope?: string,
  ) => void;

  removePokemon: (
    pokemonOrId: PickRequired<CalcdexPokemon, 'calcdexId'> | string,
    reselectLast?: boolean,
    scope?: string,
  ) => void;

  activatePokemon: (
    activeIndices: number[],
    scope?: string,
  ) => void;

  selectPokemon: (
    pokemonIndex: number,
    scope?: string,
  ) => void;

  autoSelectPokemon: (
    enabled: boolean,
    scope?: string,
  ) => void;
}

const l = logger('@showdex/components/calc/useCalcdexPokeContext()');
const s = (local: string, via?: string): string => `${l.scope}:${local}${via ? ` via ${via}` : ''}`;

export const useCalcdexPokeContext = (): CalcdexPokeContextConsumables => {
  const ctx = React.useContext(CalcdexPokeContext);
  const { playerKey, playerPokemon, presets } = ctx;

  const {
    addPokemon: addPlayerPokemon,
    importPresets: importPlayerPresets,
    updatePokemon: updatePlayerPokemon,
    removePokemon: removePlayerPokemon,
    activatePokemon,
    selectPokemon,
    autoSelectPokemon,
  } = useCalcdexContext();

  const addPokemon: CalcdexPokeContextConsumables['addPokemon'] = (
    pokemon,
    scopeFromArgs,
  ) => addPlayerPokemon(
    playerKey,
    pokemon,
    null,
    s('addPokemon()', scopeFromArgs),
  );

  const importPresets: CalcdexPokeContextConsumables['importPresets'] = (
    importedPresets,
    additionalMutations,
    config,
    scopeFromArgs,
  ) => importPlayerPresets(
    playerKey,
    importedPresets,
    additionalMutations,
    config,
    s('importPresets()', scopeFromArgs),
  );

  const applyPreset: CalcdexPokeContextConsumables['applyPreset'] = (
    presetOrId,
    additionalMutations,
    scopeFromArgs,
  ) => {
    // used for debugging purposes only
    const scope = s('applyPreset()', scopeFromArgs);
    const endTimer = runtimer(scope, l);

    const preset = typeof presetOrId === 'string'
      ? presets.find((p) => p.calcdexId === presetOrId)
      : presetOrId;

    if (!preset?.calcdexId) {
      return void endTimer('(invalid preset)');
    }

    importPresets([preset], {
      [preset.calcdexId]: additionalMutations,
    }, {
      alwaysAdd: false,
      onlyForId: playerPokemon?.calcdexId,
    }, scope);

    endTimer('(delegated)', 'onlyForId', playerPokemon?.calcdexId);
  };

  const updatePokemon: CalcdexPokeContextConsumables['updatePokemon'] = (
    pokemon,
    scopeFromArgs,
  ) => updatePlayerPokemon(
    playerKey,
    {
      ...pokemon,
      calcdexId: playerPokemon?.calcdexId,
    },
    s('updatePokemon()', scopeFromArgs),
  );

  const removePokemon: CalcdexPokeContextConsumables['removePokemon'] = (
    pokemonOrId,
    reselectLast,
    scopeFromArgs,
  ) => removePlayerPokemon(
    playerKey,
    pokemonOrId,
    reselectLast,
    s('removePokemon()', scopeFromArgs),
  );

  return {
    ...ctx,

    addPokemon,
    importPresets,
    applyPreset,
    updatePokemon,
    removePokemon,
    activatePokemon: (indices, scope) => activatePokemon(playerKey, indices, s('activatePokemon()', scope)),
    selectPokemon: (index, scope) => selectPokemon(playerKey, index, s('selectPokemon()', scope)),
    autoSelectPokemon: (enabled, scope) => autoSelectPokemon(playerKey, enabled, s('autoSelectPokemon()', scope)),
  };
};
