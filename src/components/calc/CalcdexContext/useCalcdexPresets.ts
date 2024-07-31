import * as React from 'react';
import { type ShowdexCalcdexSettings } from '@showdex/interfaces/app';
import {
  type CalcdexBattleField,
  type CalcdexBattleState,
  type CalcdexOperatingMode,
  type CalcdexPlayer,
  type CalcdexPlayerKey,
  type CalcdexPokemonPreset,
  CalcdexPlayerKeys as AllPlayerKeys,
} from '@showdex/interfaces/calc';
import { calcdexSlice, useDispatch } from '@showdex/redux/store';
import { cloneAllPokemon, clonePreset } from '@showdex/utils/battle';
import {
  calcPresetCalcdexId,
  guessServerLegacySpread,
  guessServerSpread,
  populateStatsTable,
} from '@showdex/utils/calc';
import { formatId, nonEmptyObject } from '@showdex/utils/core';
import { logger, runtimer } from '@showdex/utils/debug';
import { determineTerrain, determineWeather, getGenlessFormat } from '@showdex/utils/dex';
import {
  type CalcdexBattlePresetsHookValue,
  applyPreset,
  detectCompletePreset,
  flattenAlts,
  guessTeambuilderPreset,
  guessMatchingPresets,
  selectPokemonPresets,
  sortPresetsByFormat,
  sortPresetsByUsage,
  useBattlePresets,
  findMatchingUsage,
} from '@showdex/utils/presets';

const l = logger('@showdex/components/calc/useCalcdexPresets()');
const s = (local: string, via?: string): string => `${l.scope}:${local}${via ? ` via ${via}` : ''}`;

const playerAutoNonce = (
  player: CalcdexPlayer,
  operatingMode?: CalcdexOperatingMode,
): string => (
  player?.pokemon
    ?.filter((p) => !!p?.calcdexId && (!p.presetId || p.autoPreset))
    .map((p) => [
      p.calcdexId,
      operatingMode === 'standalone' && p.speciesForme,
      p.autoPreset ? [p.ability || '?', p.item || '?', ...(p.revealedMoves || [])].join(',') : p.presetId,
    ].filter(Boolean).join('~'))
    .join(':')
);

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

  const presetSorter = React.useMemo(
    () => sortPresetsByFormat(state?.format, presets.formatLabelMap),
    [presets.formatLabelMap, state?.format],
  );

  // keep track of whether we applied Team Sheets yet (whether initially or later)
  const appliedSheets = React.useRef(false);

  const p1AutoNonce = React.useMemo(() => playerAutoNonce(state?.p1, state?.operatingMode), [state?.operatingMode, state?.p1]);
  const p2AutoNonce = React.useMemo(() => playerAutoNonce(state?.p2, state?.operatingMode), [state?.operatingMode, state?.p2]);
  const p3AutoNonce = React.useMemo(() => playerAutoNonce(state?.p3, state?.operatingMode), [state?.operatingMode, state?.p3]);
  const p4AutoNonce = React.useMemo(() => playerAutoNonce(state?.p4, state?.operatingMode), [state?.operatingMode, state?.p4]);

  /*
  l.debug(
    'playerAutoNonce()',
    '\n', 'p1', p1AutoNonce,
    '\n', 'p2', p2AutoNonce,
    '\n', 'p3', p3AutoNonce,
    '\n', 'p4', p4AutoNonce,
  );
  */

  /* eslint-disable react-hooks/exhaustive-deps -- look at me, I'm the captain now */

  // auto-apply the first preset for every presetless Pokemon, if possible
  React.useEffect(() => {
    // used for debugging purposes only
    const scope = s('(AutoPreset)');
    const endTimer = runtimer(scope, l);

    const shouldAutoPreset = !!state?.battleId
      && !!state.format
      && presets.ready
      && AllPlayerKeys.some((key) => !!state?.[key]?.pokemon?.length);
      // && prevAutoNonce.current !== autoNonce;
      // && AllPlayerKeys.reduce((s, k) => s + (state?.[k]?.pokemon?.length ?? 0), 0) > 1;

    // note: presets.ready will be true if fetching is disabled by the user
    // (also doesn't guarantee that presets[]/usages[] are populated)
    if (!shouldAutoPreset) {
      return void endTimer('(not ready)');
    }

    const randoms = state.format.includes('random');
    const playersPayload: Partial<Record<CalcdexPlayerKey, Partial<CalcdexPlayer>>> = {};
    const field: Partial<CalcdexBattleField> = {};

    AllPlayerKeys.forEach((playerKey) => {
      const player = state[playerKey];

      if (!player?.pokemon?.length) {
        return;
      }

      const presetlessIndices = player.pokemon
        .map((p, i) => (p?.presetId && !p.autoPreset ? null : i))
        .filter((v) => typeof v === 'number');

      if (!presetlessIndices.length) {
        return;
      }

      const party = cloneAllPokemon(player.pokemon);

      /*
      l.debug(
        '(Auto-Preset)', 'player', playerKey,
        '\n', 'processing indices', presetlessIndices,
        '\n', 'filtered', presetlessIndices.map((i) => party[i]),
      );
      */

      presetlessIndices.forEach((pokemonIndex) => {
        const pokemon = party[pokemonIndex];

        const pokemonPresets = selectPokemonPresets(
          presets.presets,
          pokemon,
          {
            format: state.format,
            // source: 'smogon',
            select: 'any',
            filter: (p) => p.source !== 'usage',
          },
        ).sort(presetSorter);

        const pokemonUsages = selectPokemonPresets(
          presets.usages,
          pokemon,
          {
            format: state.format,
            formatOnly: true,
            source: 'usage',
            select: 'any',
          },
        );

        if (pokemonUsages.length > 1) {
          pokemonPresets.sort(sortPresetsByUsage(pokemonUsages));
        }

        let preset: CalcdexPokemonPreset;
        let [usage] = pokemonUsages;

        if (pokemon.source === 'server' && nonEmptyObject(pokemon.serverStats)) {
          // was gunna use this elsewhere, so I separated it from the map() below, but never ended up needing it lol
          // (in other words, too lazy to move this back into the map() below)
          const mergeMatches = (
            p: CalcdexPokemonPreset,
          ) => {
            const abilityPool = [
              ...(p.altAbilities?.length ? flattenAlts(p.altAbilities) : []),
              p.ability,
            ];

            const itemPool = [
              ...(p.altItems?.length ? flattenAlts(p.altItems) : []),
              p.item,
            ];

            const movePool = [
              ...(p.altMoves?.length ? flattenAlts(p.altMoves) : []),
              ...p.moves,
            ];

            return {
              ...p,
              ability: abilityPool.includes(pokemon.ability) ? pokemon.ability : p.ability,
              item: itemPool.includes(pokemon.item) ? pokemon.item : p.item,
              moves: pokemon.serverMoves.every((m) => movePool.includes(m))
                ? [...pokemon.serverMoves]
                : p.moves,
            };
          };

          // update (2023/12/22): Teambuilder presets have been refactored into useBattlePresets(),
          // which taps directly into the teamdexSlice state
          preset = guessTeambuilderPreset(
            [
              ...selectPokemonPresets(
                pokemonPresets,
                pokemon,
                {
                  format: state.format,
                  select: 'species',
                },
              ),
            ].map(mergeMatches),
            pokemon,
            state.format,
          );

          // if we found one, make a copy & mark it as 'server'-sourced w/ the Pokemon's actual properties
          if (preset?.calcdexId) {
            preset = clonePreset(preset);

            preset.playerName = player.name;
            preset.name = 'Yours';
            preset.source = 'server';
            preset.ability = pokemon.ability;
            preset.item = pokemon.item;
            preset.moves = [...pokemon.serverMoves].filter(Boolean);

            if (pokemon.teraType) {
              preset.teraTypes = [pokemon.teraType];
            }
          }

          // "old reliable"
          if (!preset?.calcdexId && !pokemon.transformedForme) {
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
                teraTypes: [pokemon.teraType].filter(Boolean),
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
            // note: pokemonPresets[] (from selectPokemonPresets()) will also include presets of the transformedForme
            const transformedPresets = selectPokemonPresets(
              pokemonPresets,
              pokemon,
              {
                format: state.format,
                select: 'transformed',
              },
            );

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
        if (!preset?.calcdexId && state.sheets?.length) {
          [preset] = selectPokemonPresets(
            state.sheets,
            pokemon,
            {
              format: state.format,
              source: 'sheet',
              select: 'any',
              filter: (p) => !pokemon.transformedForme || formatId(p.playerName) === formatId(player.name),
            },
          );

          // but if it's an OTS (i.e., missing exact nature, EVs & IVs), don't bother applying it
          if (!detectCompletePreset(preset)) {
            preset = null;
          }
        }

        // pre-select presets for each possible prioritizePresetSource value
        // (note: key ordering of this object doesn't matter -- we'll construct an array of keys based on the user's setting after)
        const preselections: Partial<Record<typeof settings.prioritizePresetSource, CalcdexPokemonPreset[]>> = {
          smogon: [
            ...selectPokemonPresets(pokemonPresets, pokemon, {
              format: state.format,
              formatOnly: true,
              source: 'bundle',
              select: 'one',
            }),

            ...selectPokemonPresets(pokemonPresets, pokemon, {
              format: state.format,
              formatOnly: true,
              source: 'smogon',
              select: 'one',
              // filter: (p) => ['smogon', 'bundle'].includes(p?.source), // actually nvm, can't guarantee the order using this
            }),
          ],

          ...(!randoms && {
            usage: [usage],

            storage: [
              ...selectPokemonPresets(pokemonPresets, pokemon, {
                format: state.format,
                formatOnly: true,
                source: 'storage',
                select: 'one',
              }),

              ...selectPokemonPresets(pokemonPresets, pokemon, {
                format: state.format,
                formatOnly: true,
                source: 'storage-box',
                select: 'one',
              }),
            ],
          }),
        };

        const preselectionOrder: (keyof typeof preselections)[] = [];

        if (randoms) {
          preselectionOrder.push('smogon');
        } else {
          // my brain tells me there's some nice 1 liner to this but my brain also tells me that I'm too tired to care lolol
          switch (settings?.prioritizePresetSource) {
            case 'storage': {
              preselectionOrder.push('storage', 'smogon', 'usage');

              break;
            }

            case 'usage': {
              preselectionOrder.push('usage', 'smogon', 'storage');

              break;
            }

            case 'smogon':
            default: {
              preselectionOrder.push('smogon', 'usage', 'storage');

              break;
            }
          }
        }

        // now go thru each key one by one until we find a preset
        for (const key of preselectionOrder) {
          // note: we may have a 'Yours' set already applied here, even in Randoms!
          if (preset?.calcdexId) {
            break;
          }

          const preselectedPresets = preselections[key];

          if (!preselectedPresets?.length) {
            continue;
          }

          if (key === 'smogon') {
            // for Randoms, if there's only 1 role, that's probably it, no?
            const matchedPresets = randoms && preselectedPresets.length === 1
              ? preselectedPresets
              : guessMatchingPresets(preselectedPresets, pokemon, {
                format: state.format,
                formatOnly: true,
                usages: pokemonUsages,
              });

            [preset] = matchedPresets;

            l.debug(
              '(Auto-Preset)', 'player', playerKey, 'pokemon', pokemon.ident || pokemon.speciesForme,
              '\n', 'source', key,
              '\n', 'preset', preset,
              '\n', 'matchedPresets[]', matchedPresets,
              '\n', 'preselectedPresets[]', preselectedPresets,
              '\n', 'pokemonUsages[]', pokemonUsages,
              '\n', 'pokemon', pokemon,
            );

            if (preset?.calcdexId) {
              pokemon.autoPreset = matchedPresets.length !== 1;
              pokemon.autoPresetId = (!pokemon.autoPreset && preset.calcdexId) || null;
            }
          }

          if (!preset?.calcdexId) {
            [preset] = preselectedPresets;
          }
        }

        // attempt to find a preset within the current format
        if (!preset?.calcdexId && pokemonPresets.length) {
          /*
          const formatPresets = selectPokemonPresets(
            pokemonPresets,
            pokemon,
            {
              format: state.format,
              formatOnly: true,
              source: randoms ? 'smogon' : null,
              select: 'one',
            },
          );

          if (formatPresets.length) {
            // for Randoms, if there's only 1 role, that's probably it, no? LOL
            const matchedPresets = randoms && formatPresets.length === 1
              ? formatPresets
              : guessMatchingPresets(formatPresets, pokemon, {
                format: state.format,
                formatOnly: true,
                usages: pokemonUsages,
              });

            [preset] = matchedPresets;

            l.debug(
              '(Auto-Preset)', 'player', playerKey, 'pokemon', pokemon.ident || pokemon.speciesForme,
              '\n', 'preset', preset,
              '\n', 'matchedPresets[]', matchedPresets,
              '\n', 'formatPresets[]', formatPresets,
              '\n', 'pokemonUsages[]', pokemonUsages,
              '\n', 'pokemon', pokemon,
            );

            if (preset?.calcdexId) {
              // note: turning autoPreset off when there's only 1 matched result (i.e., it's a pretty confident match)
              pokemon.autoPreset = matchedPresets.length !== 1;
              pokemon.autoPresetId = (!pokemon.autoPreset && preset.calcdexId) || null;
            }
          }

          if (!preset?.calcdexId) {
            [preset] = formatPresets;
          }

          // "Showdown Usage" preset is only made available in non-Randoms formats
          const shouldApplyUsage = !randoms
            && !!usage?.calcdexId // making sure we have a "Showdown Usage" preset to begin with!
            // only apply if we don't have a preset atm, or if we do, the prioritizeUsageStats setting is enabled &
            // the current preset isn't server-sourced
            && (!preset?.calcdexId || (settings?.prioritizeUsageStats && preset.source !== 'server'));

          if (shouldApplyUsage) {
            preset = usage;
          }
          */

          // if we still haven't found one, then try finding one from any format
          if (!preset?.calcdexId) {
            const allFormatPresets = selectPokemonPresets(
              pokemonPresets,
              pokemon,
              {
                format: state.format,
                select: 'one',
              },
            );

            if (allFormatPresets.length) {
              const matchedPresets = guessMatchingPresets(allFormatPresets, pokemon, {
                format: state.format,
                formatOnly: true,
                usages: pokemonUsages,
              });

              [preset] = matchedPresets;

              l.debug(
                '(Auto-Preset)', 'player', playerKey, 'pokemon', pokemon.ident || pokemon.speciesForme,
                '\n', 'preset', preset,
                '\n', 'matchedPresets[]', matchedPresets,
                '\n', 'allFormatPresets[]', allFormatPresets,
                '\n', 'pokemonUsages[]', pokemonUsages,
                '\n', 'pokemon', pokemon,
              );

              if (preset?.calcdexId) {
                pokemon.autoPreset = matchedPresets.length !== 1;
                pokemon.autoPresetId = (!pokemon.autoPreset && preset.calcdexId) || null;
              }
            }

            if (!preset?.calcdexId) {
              [preset] = allFormatPresets;
            }
          }
        }

        // no smogon presets are available at this point, so apply the usage if we have it
        // (encountered many cases where Pokemon only have usage w/ no pokemonPresets[], particularly in Gen 9 National Dex)
        if (!randoms && !preset?.calcdexId && usage?.calcdexId) {
          preset = usage;

          if (preset?.calcdexId) {
            pokemon.autoPreset = false;
            pokemon.autoPresetId = preset.calcdexId;
          }
        }

        // if no preset is applied, forcibly open the Pokemon's stats to alert the user
        // (also more the case in 'standalone' mode, reset some fields in case they were from a prior Pokemon w/ a preset)
        if (!preset?.calcdexId) {
          // update (2024/07/19): apparently some peeps were experiencing level discrepancies still, so I'm guessing this
          // might be the culprit since it looks like I added this part for the Honkdex & probs forgot about 'battle' modes LOL
          // pokemon.level = state.defaultLevel;
          if (!pokemon.level && state.defaultLevel) {
            pokemon.level = state.defaultLevel;
          }

          pokemon.nature = state.legacy ? 'Hardy' : 'Adamant';
          pokemon.ivs = populateStatsTable({}, { spread: 'iv', format: state.format });
          pokemon.evs = populateStatsTable({}, { spread: 'ev', format: state.format });
          pokemon.altTeraTypes = [];
          pokemon.altAbilities = [];
          pokemon.altItems = [];
          pokemon.dirtyItem = null;
          pokemon.altMoves = [];
          pokemon.moves = [];

          if (pokemon.dirtyTeraType && pokemon.types?.length) {
            [pokemon.dirtyTeraType] = pokemon.types;
          }

          pokemon.showGenetics = true;
          pokemon.autoPreset = false;
          pokemon.autoPresetId = null;

          l.debug(
            'Failed to find a preset for', pokemon.ident || pokemon.speciesForme, 'of player', playerKey,
            '\n', 'pokemon', pokemon,
            '\n', 'preset', preset,
            '\n', 'presets', presets,
            '\n', 'usage', usage,
            '\n', 'state', state,
          );

          return;
        }

        // update (2023/01/06): may need to grab an updated usage for the preset we're trying to switch to
        // (normally only an issue in Gen 9 Randoms with their role system, which has multiple usage presets)
        if (pokemonUsages.length > 1) {
          const roleUsage = findMatchingUsage(pokemonUsages, preset);

          if (roleUsage?.calcdexId) {
            usage = roleUsage;
          }
        }

        const presetPayload = {
          ...(
            pokemon.presetId !== preset.calcdexId
              // && (!usage?.calcdexId || pokemon.usageId !== usage.calcdexId)
              && applyPreset(pokemon, preset, { format: state.format, usage })
          ),
        };

        if (state.operatingMode === 'standalone') {
          presetPayload.autoPreset = false;
          presetPayload.autoPresetId = null; // ignored in 'standalone' mode, but just for completeness lol c:
        }

        /**
         * @todo update when more than 4 moves are supported
         */
        if ('moves' in presetPayload && pokemon.source !== 'server' && pokemon.revealedMoves?.length === 4) {
          delete presetPayload.moves;
        }

        party[pokemonIndex] = { ...pokemon, ...presetPayload };

        if (pokemonIndex !== player.selectionIndex) {
          return;
        }

        /**
         * @todo this matches `applyAutoFieldConditions()` from `useCalcdexContext()` so refactor me plz
         */
        const autoWeather = determineWeather(party[pokemonIndex], state.format);
        const autoTerrain = determineTerrain(party[pokemonIndex]);

        // update (2024/07/28): as mentioned in the aforementioned local helper function in the aforementioned hook,
        // we'll keep any user-specified weather & terrain in-tact (except when an empty string, i.e., `''` -- manually cleared)
        if (autoWeather) {
          field.autoWeather = autoWeather;

          if (state.field.dirtyWeather === '' as typeof field.dirtyWeather) {
            field.dirtyWeather = null;
          }
        }

        if (autoTerrain) {
          field.autoTerrain = autoTerrain;

          if (state.field.dirtyTerrain === '' as typeof field.dirtyTerrain) {
            field.dirtyTerrain = null;
          }
        }
      });

      playersPayload[playerKey] = { pokemon: party };
    });

    if (!nonEmptyObject(playersPayload)) {
      return void endTimer('(no change)');
    }

    dispatch(calcdexSlice.actions.update({
      scope: l.scope,
      battleId: state.battleId,
      ...playersPayload,
      field,
    }));

    // prevAutoNonce.current = autoNonce;

    endTimer('(dispatched)');
  }, [
    p1AutoNonce,
    p2AutoNonce,
    p3AutoNonce,
    p4AutoNonce,
    presets.ready,
    state?.battleId,
    state?.format,
  ]);

  React.useEffect(() => {
    // used for debugging purposes only
    const scope = s('(Sheets)');
    const endTimer = runtimer(scope, l);

    const shouldApplySheets = !appliedSheets.current
      && !!state?.battleId
      && !!state.format
      && !!state.sheetsNonce
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
        .map((p, i) => (p.source === 'server' ? null : i))
        .filter((v) => typeof v === 'number');

      if (!nonServerIndices.length) {
        return;
      }

      let didUpdate = false;

      nonServerIndices.forEach((pokemonIndex) => {
        const pokemon = party[pokemonIndex];

        const [sheet] = selectPokemonPresets(
          state.sheets,
          pokemon,
          {
            format: state.format,
            source: 'sheet',
            select: 'one',
            filter: (p) => !!pokemon.transformedForme || formatId(p.playerName) === formatId(player.name),
          },
        );

        if (!sheet?.calcdexId) {
          return;
        }

        const pokemonUsages = selectPokemonPresets(
          presets.usages,
          pokemon,
          {
            format: state.format,
            formatOnly: true,
            source: 'usage',
            select: 'one',
          },
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
          ...applyPreset(pokemon, sheet, { format: state.format, usage }),
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
    state?.sheetsNonce,
    ...AllPlayerKeys.map((key) => state?.[key]?.pokemon?.length),
  ]);

  /* eslint-enable react-hooks/exhaustive-deps */

  return presets;
};
