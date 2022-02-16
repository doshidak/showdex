import { FormatLabels } from '@showdex/consts';
import { runtimeFetch } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import type {
  AbilityName,
  GenerationNum,
  ItemName,
  MoveName,
} from '@pkmn/data';
import type { CalcdexPokemonPreset } from './CalcdexReducer';
import { calcPresetCalcdexId } from './calcCalcdexId';
import { sanitizeSpeciesForme } from './sanitizeSpeciesForme';

export interface PkmnSmogonPreset {
  ability: AbilityName | AbilityName[];
  nature: Showdown.PokemonNature | Showdown.PokemonNature[];
  item: ItemName | ItemName[];
  moves: (MoveName | MoveName[])[];
  ivs?: Showdown.StatsTable;
  evs?: Showdown.StatsTable;
}

export type PkmnSmogonPresets = {
  [speciesForme: string]: {
    [format: string]: {
      [presetName: string]: PkmnSmogonPreset;
    };
  };
};

export type PkmnSmogonPresetCache = {
  [genName: string]: {
    [speciesForme: string]: CalcdexPokemonPreset[];
  };
};

const l = logger('Calcdex/fetchSmogonPresets');

/**
 * @todo store the presets in a React state and only fetch the presets from the state, not `pokemon.presets`
 * (which you should totally get rid of too)
 */

/** @todo this obviously doesn't work cause it'll be empty on every call */
const presetCache: PkmnSmogonPresetCache = {};

// l.debug('presetCache', '(outside func def)', presetCache);

/**
 * @deprecated Use `usePresetCache()` instead.
 */
export const fetchSmogonPresets = async (
  speciesForme: string,
  gen: GenerationNum,
): Promise<CalcdexPokemonPreset[]> => {
  const sanitizedSpeciesForme = sanitizeSpeciesForme(speciesForme);

  if (!sanitizedSpeciesForme) {
    l.debug(
      'fetchSmogonPresets() <- sanitizeSpeciesForme()',
      '\n', 'received a falsy value back',
      '\n', 'sanitizedSpeciesForme', sanitizedSpeciesForme,
      '\n', 'speciesForme', speciesForme,
      '\n', 'gen', gen,
    );

    return [];
  }

  const genName = `gen${gen}`;

  // l.debug('presetCache', presetCache);

  if (sanitizedSpeciesForme in (presetCache[genName] ?? {})) {
    const presets = presetCache[genName][sanitizedSpeciesForme];

    l.debug(
      'found cached presets for Pokemon', sanitizedSpeciesForme,
      '\n', 'presets', presets,
      '\n', 'gen', gen,
    );

    return presets;
  }

  const url = `${process.env.SMOGON_PRESETS_URL}/${genName}.json`;

  l.debug(
    'fetchSmogonPresets() -> await runtimeFetch()',
    '\n', 'url', url,
  );

  const response = await runtimeFetch(url);
  const data = <PkmnSmogonPresets> await response.json();

  l.debug(
    'fetchSmogonPresets() <- await runtimeFetch()',
    '\n', 'data', data,
  );

  if (!Object.keys(data || {}).length) {
    l.warn('received no Smogon presets!');

    return [];
  }

  if (!(genName in presetCache)) {
    presetCache[genName] = {};
  }

  Object.entries(data).forEach(([forme, formats]) => {
    const sanitizedForme = sanitizeSpeciesForme(forme);

    if (!Array.isArray(presetCache[genName][sanitizedForme])) {
      presetCache[genName][sanitizedForme] = [];
    }

    Object.entries(formats).forEach(([format, presets]) => {
      Object.entries(presets).forEach(([presetName, preset]) => {
        const formatLabel = format in FormatLabels ? FormatLabels[format] : format?.toUpperCase?.();
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

        const index = presetCache[genName][sanitizedForme]
          .findIndex((p) => p.calcdexId === calcdexPreset.calcdexId);

        if (index > -1) {
          presetCache[genName][sanitizedForme][index] = calcdexPreset;
        } else {
          presetCache[genName][sanitizedForme].push(calcdexPreset);
        }
      });
    });
  });

  const presets = presetCache[genName][sanitizedSpeciesForme];

  l.debug(
    'returning downloaded presets for Pokemon', sanitizedSpeciesForme,
    '\n', 'presets', presets,
  );

  return presets;
};
