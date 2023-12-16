import * as React from 'react';
import { type CalcdexPokemon, type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
import { logger, runtimer } from '@showdex/utils/debug';
import { appliedPreset, applyPreset as applyPokemonPreset, flattenAlts } from '@showdex/utils/presets';
import { useCalcdexContext } from '../CalcdexContext';
import { type CalcdexPokeContextValue, CalcdexPokeContext } from './CalcdexPokeContext';

/**
 * Pokemon-specific Calcdex Context value with some abstracted dispatchers, available to Consumers of said Context.
 *
 * @since 1.1.7
 */
export interface CalcdexPokeContextConsumables extends CalcdexPokeContextValue {
  updatePokemon: (
    pokemon: Partial<CalcdexPokemon>,
    scope?: string,
  ) => void;

  applyPreset: (
    presetOrId: CalcdexPokemonPreset | string,
    additionalMutations?: Partial<CalcdexPokemon>,
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

  const {
    state,
    // settings,
    playerKey,
    playerPokemon,
    presets,
    usages,
    usage,
  } = ctx;

  const {
    updatePokemon: updateCalcdexPokemon,
    activatePokemon,
    selectPokemon,
    autoSelectPokemon,
  } = useCalcdexContext();

  const updatePokemon: CalcdexPokeContextConsumables['updatePokemon'] = (
    pokemon,
    scopeFromArgs,
  ) => {
    // used for debugging purposes only
    const scope = s('updatePokemon()', scopeFromArgs);

    updateCalcdexPokemon(playerKey, {
      ...pokemon,
      calcdexId: playerPokemon?.calcdexId,
    }, scope);
  };

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

    if (appliedPreset(state?.format, playerPokemon, preset)) {
      if (playerPokemon.presetId !== preset.calcdexId) {
        updatePokemon({
          ...additionalMutations,
          presetId: preset.calcdexId,
          presetSource: preset.source,
        }, scope);
      }

      return void endTimer('(no change)');
    }

    const presetMoves = preset.altMoves?.length ? flattenAlts(preset.altMoves) : preset.moves;
    const presetUsage = (usages.length === 1 && usage)
      || usages.find((u) => {
        const movePool = flattenAlts(u.altMoves);

        return presetMoves.every((m) => movePool.includes(m));
      })
      || usage;

    const presetPayload = applyPokemonPreset(state.format, {
      ...playerPokemon,
      ...additionalMutations,
    }, preset, presetUsage);

    /**
     * @todo update when more than 4 moves are supported
     */
    if (state.active && !playerPokemon.serverSourced && playerPokemon.revealedMoves.length === 4) {
      delete presetPayload.moves;
    }

    updatePokemon({
      ...additionalMutations,
      ...presetPayload,
    }, scope);

    endTimer('(update called)');
  };

  return {
    ...ctx,

    updatePokemon,
    applyPreset,
    activatePokemon: (indices, scope) => activatePokemon(playerKey, indices, s('activatePokemon()', scope)),
    selectPokemon: (index, scope) => selectPokemon(playerKey, index, s('selectPokemon()', scope)),
    autoSelectPokemon: (enabled, scope) => autoSelectPokemon(playerKey, enabled, s('autoSelectPokemon()', scope)),
  };
};
