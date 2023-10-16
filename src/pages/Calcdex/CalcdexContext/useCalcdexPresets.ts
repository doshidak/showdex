import * as React from 'react';
import { AllPlayerKeys } from '@showdex/consts/battle';
import {
  type CalcdexBattleState,
  type CalcdexPlayer,
  type CalcdexPlayerKey,
  type CalcdexPokemonPreset,
  type ShowdexCalcdexSettings,
  calcdexSlice,
  useDispatch,
} from '@showdex/redux/store';
import { cloneAllPokemon, clonePreset } from '@showdex/utils/battle';
import { calcPresetCalcdexId, guessServerLegacySpread, guessServerSpread } from '@showdex/utils/calc';
import { formatId, nonEmptyObject } from '@showdex/utils/core';
import { logger, runtimer } from '@showdex/utils/debug';
import { getGenlessFormat } from '@showdex/utils/dex';
import {
  type CalcdexBattlePresetsHookValue,
  applyPreset,
  flattenAlts,
  getPresetFormes,
  guessTeambuilderPreset,
  selectPokemonPresets,
  sortPresetsByFormat,
  useBattlePresets,
} from '@showdex/utils/presets';

const l = logger('@showdex/pages/Calcdex/CalcdexContext/useCalcdexPresets()');
const s = (local: string, via?: string): string => `${l.scope}:${local}${via ? ` via ${via}` : ''}`;

/**
 * Basically does what `useBattlePresets()` does, but also auto-applies the first preset for any preset-less Pokemon
 * for every player in the provided `state`.
 *
 * * Remember when the auto-preset logic was in `syncBattle()`, `syncPokemon()` & `CalcdexPokeProvider`, not to mention the
 *   spaghetti of booleans in the latter to make sure React didn't infinitely re-render itself til the death of the universe?
 *   - Ya, me neither!
 *   - Anyway, all of the auto-preset logic, including applying Teambuilder & server-sourced sets, are all handled here.
 *
 * @since 1.1.7
 */
export const useCalcdexPresets = (
  state: CalcdexBattleState,
  settings: ShowdexCalcdexSettings,
): CalcdexBattlePresetsHookValue => {
  const dispatch = useDispatch();

  const presets = useBattlePresets({
    format: state?.format,
  });

  /* eslint-disable react-hooks/exhaustive-deps -- look at me, I'm the captain now */

  // keep track of whether we applied Team Sheets yet (whether initially or later)
  const appliedSheets = React.useRef(false);

  // auto-apply the first preset for every presetless Pokemon, if possible
  React.useEffect(() => {
    // used for debugging purposes only
    const scope = s('[presetless]');
    const endTimer = runtimer(scope, l);

    const shouldAutoPreset = !!state?.battleId
      && !!state.format
      && presets.ready
      && AllPlayerKeys.some((key) => !!state?.[key]?.pokemon?.length);
      // && AllPlayerKeys.reduce((s, k) => s + (state?.[k]?.pokemon?.length ?? 0), 0) > 1;

    // note: presets.ready will be true if fetching is disabled by the user
    // (also doesn't guarantee that presets[]/usages[] are populated)
    if (!shouldAutoPreset) {
      return void endTimer('(not ready)');
    }

    const randoms = state.format.includes('random');
    const playersPayload: Partial<Record<CalcdexPlayerKey, Partial<CalcdexPlayer>>> = {};

    AllPlayerKeys.forEach((playerKey) => {
      const player = state[playerKey];

      if (!player?.pokemon?.length) {
        return;
      }

      const party = cloneAllPokemon(player.pokemon);
      const presetlessIndices = party
        .map((p, i) => (p.presetId ? null : i))
        .filter((v) => typeof v === 'number');

      if (!presetlessIndices.length) {
        return;
      }

      // that one trick pro programmers don't want you to know about
      let didUpdate = false;
      let didApplySheet = false;

      presetlessIndices.forEach((pokemonIndex) => {
        const pokemon = party[pokemonIndex];

        // note: getPresetFormes() will return an empty array if transformedForme is falsy
        const speciesFormes = getPresetFormes(pokemon.speciesForme, state.format);
        const transformedFormes = getPresetFormes(pokemon.transformedForme, state.format);
        const formes = [...transformedFormes, ...speciesFormes];

        const pokemonPresets = selectPokemonPresets(
          presets.presets,
          pokemon,
          'smogon',
          state.format,
          formes,
        ).sort(sortPresetsByFormat(state.format));

        const pokemonUsages = selectPokemonPresets(
          presets.usages,
          pokemon,
          'usage',
          state.format,
          formes,
        );

        let preset: CalcdexPokemonPreset;
        let [usage] = pokemonUsages;

        if (pokemon.serverSourced && nonEmptyObject(pokemon.serverStats)) {
          // was gunna use this elsewhere, so I separated it from the map() below, but never ended up needing it lol
          const mergeMatches = (
            p: CalcdexPokemonPreset,
          ) => ({
            ...p,
            ability: p.altAbilities?.includes(pokemon.ability) ? pokemon.ability : p.ability,
            item: p.altItems?.includes(pokemon.item) ? pokemon.item : p.item,
            moves: p.altMoves?.length && pokemon.serverMoves.every((m) => flattenAlts(p.altMoves).includes(m))
              ? [...pokemon.serverMoves]
              : p.moves,
          });

          // Teambuilder presets should've been synced by syncBattle() & available in pokemon.presets[] by now
          // hmm, is this ambitious? idk
          preset = guessTeambuilderPreset([
            ...(pokemon.presets?.length ? pokemon.presets : []),
            ...pokemonPresets.filter((p) => speciesFormes.includes(p.speciesForme)),
          ].map(mergeMatches), pokemon, state.format);

          // if we found one, make a copy & mark it as 'server'-sourced w/ the Pokemon's actual properties
          if (preset?.calcdexId) {
            preset = clonePreset(preset);

            preset.playerName = player.name;
            preset.name = 'Yours';
            preset.source = 'server';
            preset.teraTypes = [pokemon.revealedTeraType].filter(Boolean);
            preset.ability = pokemon.ability;
            preset.item = pokemon.item;
            preset.moves = [...pokemon.serverMoves].filter(Boolean);
          }

          // "old reliable"
          // note: ServerPokemon info may be of the transformed Pokemon's moves, not the pre-transformed ones!!
          // (hence the `pokemon.transformedMoves` check)
          if (!preset && !pokemon.transformedForme) {
            const guessedSpread = state.legacy
              ? guessServerLegacySpread(state.format, pokemon)
              : guessServerSpread(state.format, pokemon);

            if (nonEmptyObject(guessedSpread)) {
              preset = {
                calcdexId: null,
                id: null,
                source: 'server',
                playerName: player.name,
                name: 'Yours',
                gen: state.gen,
                format: getGenlessFormat(state.format),
                speciesForme: pokemon.speciesForme,
                level: pokemon.level,
                gender: pokemon.gender,
                teraTypes: [pokemon.revealedTeraType].filter(Boolean),
                ability: pokemon.ability,
                item: pokemon.item,
                moves: [...pokemon.serverMoves].filter(Boolean),
                ...guessedSpread,
              };

              preset.calcdexId = calcPresetCalcdexId(preset);
              preset.id = preset.calcdexId;
            }
          }

          const shouldAddServerPreset = !!preset?.calcdexId
            && !pokemon.presets.some((p) => p?.source === 'server');

          if (shouldAddServerPreset) {
            pokemon.presets.unshift(preset);
          }

          // if at this stage the Pokemon is transformed, ignore whatever preset we found beforehand
          if (pokemon.transformedForme && (!preset?.speciesForme || preset.speciesForme !== pokemon.transformedForme)) {
            const transformedPresets = pokemonPresets.filter((p) => transformedFormes.includes(p.speciesForme));

            preset = (
              !!pokemon.transformedMoves?.length
                && !!transformedPresets.length
                && transformedPresets.find((p) => {
                  const movePool = [
                    ...(p.altMoves?.length ? flattenAlts(p.altMoves) : []),
                    ...p.moves,
                  ];

                  return pokemon.transformedMoves.every((m) => movePool.includes(m));
                })
            ) || null;
          }
        }

        // apply any sheets, if available at this stage
        // (there's another effect hook below to handle sheets sent later)
        if (!preset && state.sheets?.length) {
          [preset] = selectPokemonPresets(
            state.sheets,
            pokemon,
            'sheet',
            state.format,
            formes,
            (p) => !pokemon.transformedForme || formatId(p.playerName) === formatId(player.name),
          );

          if (preset?.calcdexId) {
            didApplySheet = true;
          }
        }

        // "Showdown Usage" preset is only made available in non-Randoms formats
        if (!preset && !randoms && usage?.calcdexId && settings?.prioritizeUsageStats) {
          preset = usage;
        }

        if (!preset && pokemonPresets.length) {
          [preset] = pokemonPresets;
        }

        if (!preset?.calcdexId) {
          return;
        }

        // update (2023/01/06): may need to grab an updated usage for the preset we're trying to switch to
        // (normally only an issue in Gen 9 Randoms with their role system, which has multiple usage presets)
        if (randoms && pokemonUsages.length > 1) {
          const roleUsage = pokemonUsages.find((p) => formatId(preset.name).includes(formatId(p.name)));

          if (roleUsage?.calcdexId) {
            usage = roleUsage;
          }
        }

        party[pokemonIndex] = {
          ...pokemon,
          ...applyPreset(state.format, pokemon, preset, usage),
        };

        didUpdate = true;
      });

      if (!didUpdate) {
        return;
      }

      if (didApplySheet) {
        appliedSheets.current = true;
      }

      playersPayload[playerKey] = {
        pokemon: party,
      };
    });

    if (!nonEmptyObject(playersPayload)) {
      return void endTimer('(no change)');
    }

    dispatch(calcdexSlice.actions.updatePlayer({
      scope: l.scope,
      battleId: state.battleId,
      ...playersPayload,
    }));

    endTimer('(dispatched)');
  }, [
    presets.ready,
    state?.battleId,
    state?.format,
    ...AllPlayerKeys.map((key) => state?.[key]?.pokemon?.filter((p) => !p?.presetId).length),
  ]);

  React.useEffect(() => {
    // used for debugging purposes only
    const scope = s('[sheets]');
    const endTimer = runtimer(scope, l);

    const shouldApplySheets = !appliedSheets.current
      && !!state?.battleId
      && !!state.format
      && !!state.sheets?.length
      && AllPlayerKeys.some((key) => !!state[key]?.pokemon?.length);

    if (!shouldApplySheets) {
      return void endTimer(appliedSheets.current ? '(already applied)' : '(not ready)');
    }

    const playerPayload: Partial<Record<CalcdexPlayerKey, Partial<CalcdexPlayer>>> = {};

    AllPlayerKeys.forEach((playerKey) => {
      const player = state[playerKey];

      if (!player?.pokemon?.length) {
        return;
      }

      const party = cloneAllPokemon(player.pokemon);
      const nonServerIndices = party
        .map((p, i) => (p.serverSourced ? null : i))
        .filter((v) => typeof v === 'number');

      if (!nonServerIndices.length) {
        return;
      }

      let didUpdate = false;

      nonServerIndices.forEach((pokemonIndex) => {
        const pokemon = party[pokemonIndex];

        const formes = [
          ...getPresetFormes(pokemon.transformedForme, state.format),
          ...getPresetFormes(pokemon.speciesForme, state.format),
        ];

        const [sheet] = selectPokemonPresets(
          state.sheets,
          pokemon,
          'sheet',
          state.format,
          formes,
          (p) => !pokemon.transformedForme || formatId(p.playerName) === formatId(player.name),
        );

        if (!sheet?.calcdexId) {
          return;
        }

        const pokemonUsages = selectPokemonPresets(
          presets.usages,
          pokemon,
          'usage',
          state.format,
          formes,
        );

        const usage = (
          pokemonUsages.length > 1
            && pokemonUsages.find((p) => {
              const pool = flattenAlts(p.altMoves);

              return sheet.moves.every((m) => pool.includes(m));
            })
        ) || pokemonUsages[0];

        party[pokemonIndex] = {
          ...pokemon,
          ...applyPreset(state.format, pokemon, sheet, usage),
        };

        didUpdate = true;
      });

      if (!didUpdate) {
        return;
      }

      playerPayload[playerKey] = {
        pokemon: party,
      };
    });

    if (!nonEmptyObject(playerPayload)) {
      return void endTimer('(no change)');
    }

    appliedSheets.current = true;

    dispatch(calcdexSlice.actions.updatePlayer({
      scope: l.scope,
      battleId: state.battleId,
      ...playerPayload,
    }));

    endTimer('(dispatched)');
  }, [
    state?.battleId,
    state?.format,
    state?.sheets?.length,
    ...AllPlayerKeys.map((key) => state?.[key]?.pokemon?.length),
  ]);

  /* eslint-enable react-hooks/exhaustive-deps */

  return presets;
};
