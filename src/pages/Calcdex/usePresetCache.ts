import * as React from 'react';
import { FormatLabels } from '@showdex/consts';
import { runtimeFetch } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import type {
  AbilityName,
  ItemName,
  MoveName,
} from '@pkmn/data';
import type { CalcdexPokemonPreset } from './CalcdexReducer';
import { calcPresetCalcdexId } from './calcCalcdexId';
import { detectGenFromFormat } from './detectGenFromFormat';
import { sanitizeSpeciesForme } from './sanitizeSpeciesForme';

export interface PkmnSmogonPreset {
  ability: AbilityName | AbilityName[];
  nature: Showdown.PokemonNature | Showdown.PokemonNature[];
  item: ItemName | ItemName[];
  moves: (MoveName | MoveName[])[];
  ivs?: Showdown.StatsTable;
  evs?: Showdown.StatsTable;
}

export type PkmnSmogonPresetFormats = {
  [format: string]: {
    [presetName: string]: PkmnSmogonPreset;
  };
};

export type PkmnSmogonPresets = {
  [speciesForme: string]: PkmnSmogonPresetFormats;
};

export interface PkmnSmogonRandomPreset {
  level: number;
  abilities: AbilityName[];
  items: ItemName[];
  moves: MoveName[];
  ivs?: Showdown.StatsTable;
  evs?: Showdown.StatsTable;
}

export type PkmnSmogonRandomPresets = {
  [speciesForme: string]: PkmnSmogonRandomPreset;
};

export type PkmnSmogonPresetCache = {
  [genName: string]: {
    [speciesForme: string]: CalcdexPokemonPreset[];
  };
};

export interface PresetCacheHookInterface {
  loading: boolean;
  available: (format: string) => boolean;
  fetch: (format: string, force?: boolean) => Promise<void>;
  get: (format: string, speciesForme: string) => CalcdexPokemonPreset[];
  purge: () => void;
}

const l = logger('Calcdex/usePresetCache');

export const usePresetCache = (): PresetCacheHookInterface => {
  const [presetCache, setPresetCache] = React.useState<PkmnSmogonPresetCache>({});
  const [loading, setLoading] = React.useState<boolean>(false);

  const available: PresetCacheHookInterface['available'] = (format) => {
    if (!format) {
      l.warn(
        'available()',
        '\n', 'something something you forgot the format lmao',
        '\n', 'format', format,
      );

      return false;
    }

    const isRandom = format.includes('random');
    const genName = isRandom ? format : `gen${detectGenFromFormat(format)}`;

    return !!Object.keys(presetCache[genName] || {}).length;
  };

  const fetch: PresetCacheHookInterface['fetch'] = async (format, force) => {
    if (!format) {
      l.warn(
        'fetch()',
        '\n', 'you forgot to specify the format dummy',
        '\n', 'format', format,
      );

      return;
    }

    const isRandom = format.includes('random');
    const genName = isRandom ? format : `gen${detectGenFromFormat(format)}`;

    if (available(format) && !force) {
      l.debug(
        'fetch()',
        '\n', 'seems like the presets for this', isRandom ? 'format' : 'gen', 'have been fetched already',
        '\n', '(if you want to fetch them again, pass `true` for the second `force` argument)',
        '\n', 'format', format,
        '\n', 'genName', genName,
        '\n', 'presetCache', presetCache,
      );

      return;
    }

    const baseUrl = isRandom ?
      process.env.SMOGON_RANDOM_PRESETS_URL :
      process.env.SMOGON_PRESETS_URL;

    const url = `${baseUrl}/${genName}.json`;

    l.debug(
      'fetch() -> await runtimeFetch()',
      '\n', 'url', url,
    );

    setLoading(true);

    let downloadedData = {};

    const response = await runtimeFetch(url);
    // const data = await response.json();
    downloadedData = await response.json();

    l.debug(
      'fetch() <- await runtimeFetch()',
      '\n', 'downloadedData', downloadedData,
    );

    if (!Object.keys(downloadedData || {}).length) {
      l.warn(
        'o snap! no presets bruh',
        '\n', 'isRandom?', isRandom,
        '\n', 'genName', genName,
        '\n', 'format', format,
      );

      return;
    }

    // gen8bdsp* is a format that requires some additional sets from gen4
    // (otherwise, some Pokemon [like Breloom] won't have any sets since they doesn't exist in gen8)
    if (!isRandom && format.startsWith('gen8bdsp')) {
      const gen4Url = `${baseUrl}/gen4.json`;

      l.debug(
        'fetch() -> await runtimeFetch()',
        '\n', 'downloading additional presets from gen4 since format is gen8bdsp* (not random)',
        '\n', 'gen4Url', gen4Url,
        '\n', 'format', format,
      );

      const gen4Response = await runtimeFetch(gen4Url);
      const gen4Data = await gen4Response.json();

      l.debug(
        'fetch() <- await runtimeFetch()',
        '\n', 'gen4Data', gen4Data,
      );

      // inject the presets into what already have; otherwise, we'll overwrite existing ones!
      Object.entries(gen4Data).forEach(([forme, formats]) => {
        if (!(forme in downloadedData)) {
          downloadedData[forme] = <Record<string, unknown>> formats;

          return;
        }

        Object.entries(<Record<string, Record<string, unknown>>> formats).forEach(([currentFormat, presets]) => {
          if (!(currentFormat in downloadedData[forme])) {
            (<Record<string, Record<string, unknown>>> downloadedData[forme])[currentFormat] = presets;

            return;
          }

          (<Record<string, Record<string, unknown>>> downloadedData[forme])[currentFormat] = {
            ...(<Record<string, Record<string, unknown>>> downloadedData[forme])[currentFormat],
            ...presets,
          };
        });
      });

      l.debug(
        'post gen4Data injection into downloadedData',
        '\n', 'downloadedData', downloadedData,
      );
    }

    setPresetCache((prevPresetCache) => {
      // every format will be under `gen<#>`, except for randoms
      if (!(genName in prevPresetCache)) {
        prevPresetCache[genName] = {};
      }

      Object.entries(downloadedData).forEach(([forme, value]) => {
        const sanitizedForme = sanitizeSpeciesForme(forme);

        if (!Array.isArray(prevPresetCache[genName][sanitizedForme])) {
          prevPresetCache[genName][sanitizedForme] = [];
        }

        if (isRandom) {
          // literally redeclared just for TypeScript lmao
          const preset = <PkmnSmogonRandomPreset> value;

          const calcdexPreset: CalcdexPokemonPreset = {
            name: 'Randoms',
            species: forme, // purposefully not sanitized
            level: preset?.level,

            ability: preset?.abilities?.[0],
            altAbilities: preset?.abilities,

            // seems that all Pokemon have the Hardy nature
            // (according to https://calc.pokemonshowdown.com/randoms.html)
            nature: 'Hardy',

            item: preset?.items?.[0],
            altItems: preset?.items,

            moves: preset?.moves?.slice?.(0, 4),
            altMoves: preset?.moves,

            ivs: {
              hp: preset?.ivs?.hp ?? 31,
              atk: preset?.ivs?.atk ?? 31,
              def: preset?.ivs?.def ?? 31,
              spa: preset?.ivs?.spa ?? 31,
              spd: preset?.ivs?.spd ?? 31,
              spe: preset?.ivs?.spe ?? 31,
            },

            // all EVs default to 84
            // (according to https://calc.pokemonshowdown.com/randoms.html)
            evs: {
              hp: preset?.evs?.hp ?? 84,
              atk: preset?.evs?.atk ?? 84,
              def: preset?.evs?.def ?? 84,
              spa: preset?.evs?.spa ?? 84,
              spd: preset?.evs?.spd ?? 84,
              spe: preset?.evs?.spe ?? 84,
            },
          };

          calcdexPreset.calcdexId = calcPresetCalcdexId(calcdexPreset);

          const index = prevPresetCache[genName][sanitizedForme]
            .findIndex((p) => p.calcdexId === calcdexPreset.calcdexId);

          if (index > -1) {
            prevPresetCache[genName][sanitizedForme][index] = calcdexPreset;
          } else {
            prevPresetCache[genName][sanitizedForme].push(calcdexPreset);
          }
        } else {
          Object.entries(<PkmnSmogonPresetFormats> value).forEach(([currentFormat, presets]) => {
            Object.entries(presets).forEach(([presetName, preset]) => {
              const formatLabel = currentFormat in FormatLabels ?
                FormatLabels[currentFormat] :
                currentFormat?.toUpperCase?.();

              const altMoves = preset?.moves?.flatMap?.((move) => move) ?? [];

              const calcdexPreset: CalcdexPokemonPreset = {
                name: `${formatLabel} ${presetName}`, // e.g., 'OU Defensive Pivot'
                species: forme, // purposefully not sanitized

                ability: Array.isArray(preset?.ability) ? preset.ability[0] : preset?.ability,
                altAbilities: Array.isArray(preset?.ability) ? preset.ability : [preset?.ability].filter(Boolean),

                nature: Array.isArray(preset?.nature) ? preset.nature[0] : preset?.nature,

                item: Array.isArray(preset?.item) ? preset.item[0] : preset?.item,
                altItems: Array.isArray(preset?.item) ? preset.item : [preset?.item].filter(Boolean),

                moves: preset?.moves?.map?.((move) => (Array.isArray(move) ? move[0] : move)) ?? [],
                altMoves: altMoves.filter((m, i) => !altMoves.includes(m, i + 1)), // remove duplicate moves

                ivs: {
                  hp: preset?.ivs?.hp ?? 31,
                  atk: preset?.ivs?.atk ?? 31,
                  def: preset?.ivs?.def ?? 31,
                  spa: preset?.ivs?.spa ?? 31,
                  spd: preset?.ivs?.spd ?? 31,
                  spe: preset?.ivs?.spe ?? 31,
                },

                evs: preset?.evs,
              };

              calcdexPreset.calcdexId = calcPresetCalcdexId(calcdexPreset);

              const index = prevPresetCache[genName][sanitizedForme]
                .findIndex((p) => p.calcdexId === calcdexPreset.calcdexId);

              if (index > -1) {
                prevPresetCache[genName][sanitizedForme][index] = calcdexPreset;
              } else {
                prevPresetCache[genName][sanitizedForme].push(calcdexPreset);
              }
            });
          });
        }
      });

      l.debug(
        'fetch()',
        '\n', 'finished processing and caching presets from Smogon',
        '\n', 'presetCache[', genName, ']', prevPresetCache[genName],
        '\n', 'presetCache', prevPresetCache,
        '\n', 'isRandom?', isRandom,
        '\n', 'genName', genName,
        '\n', 'format', format,
      );

      setLoading(false);

      return prevPresetCache;
    });
  };

  const get: PresetCacheHookInterface['get'] = (format, speciesForme) => {
    if (!format) {
      l.warn(
        'get()',
        '\n', 'you forgot to specify the format dum dum',
        '\n', 'format', format,
        '\n', 'speciesForme', speciesForme,
      );

      return [];
    }

    const isRandom = format.includes('random');
    const genName = isRandom ? format : `gen${detectGenFromFormat(format)}`;

    if (!speciesForme) {
      l.warn(
        'get()',
        '\n', 'need a mon (speciesForme) to pull them presets bruh',
        '\n', 'isRandom?', isRandom,
        '\n', 'genName', genName,
        '\n', 'format', format,
        '\n', 'speciesForme', speciesForme,
      );

      return [];
    }

    const sanitizedSpeciesForme = sanitizeSpeciesForme(speciesForme);

    if (!(sanitizedSpeciesForme in (presetCache[genName] ?? {}))) {
      l.debug(
        'get()',
        '\n', 'no presets for the Pokemon', sanitizedSpeciesForme, 'sadge :(',
        '\n', 'isRandom?', isRandom,
        '\n', 'genName', genName,
        '\n', 'format', format,
        '\n', 'speciesForme', speciesForme,
      );

      return [];
    }

    const formatLabel = format in FormatLabels ?
      FormatLabels[format] :
      format?.toUpperCase?.();

    const presets = presetCache[genName][sanitizedSpeciesForme];

    // put the presets in the current tier first, then the rest
    presets.sort((a, b) => {
      if (a.name.startsWith(formatLabel)) {
        return -1;
      }

      if (b.name.startsWith(formatLabel)) {
        return 1;
      }

      return 0;
    });

    l.debug(
      'found cached presets for Pokemon', sanitizedSpeciesForme,
      '\n', 'presets', presets,
      '\n', 'isRandom?', isRandom,
      '\n', 'genName', genName,
      '\n', 'format', format,
      '\n', 'speciesForme', speciesForme,
    );

    return presets;
  };

  const purge: PresetCacheHookInterface['purge'] = () => {
    l.debug(
      'purge()',
      '\n', 'preset cache is going bye bye',
    );

    setPresetCache({});
  };

  return {
    loading,
    available,
    fetch,
    get,
    purge,
  };
};
