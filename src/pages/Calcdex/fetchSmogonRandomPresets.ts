import { runtimeFetch } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import type {
  AbilityName,
  ItemName,
  MoveName,
} from '@pkmn/data';
import type { CalcdexPokemonPreset } from './CalcdexReducer';
import { calcPresetCalcdexId } from './calcCalcdexId';
import { sanitizeSpeciesForme } from './sanitizeSpeciesForme';

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

export type PkmnSmogonRandomPresetCache = {
  [format: string]: {
    [speciesForme: string]: CalcdexPokemonPreset[];
  };
};

const l = logger('Calcdex/fetchSmogonRandomPresets');

/** @todo this obviously doesn't work cause it'll be empty on every call */
const presetCache: PkmnSmogonRandomPresetCache = {};

/**
 * @deprecated Use `usePresetCache()` instead.
 */
export const fetchSmogonRandomPresets = async (
  speciesForme: string,
  format: string,
): Promise<CalcdexPokemonPreset[]> => {
  const sanitizedSpeciesForme = sanitizeSpeciesForme(speciesForme);

  if (!sanitizedSpeciesForme) {
    l.debug(
      'fetchSmogonRandomPresets() <- sanitizeSpeciesForme()',
      '\n', 'received a falsy value back',
      '\n', 'sanitizedSpeciesForme', sanitizedSpeciesForme,
      '\n', 'speciesForme', speciesForme,
      '\n', 'format', format,
    );

    return [];
  }

  if (sanitizedSpeciesForme in (presetCache[format] ?? {})) {
    const presets = presetCache[format][sanitizedSpeciesForme];

    l.debug(
      'found cached random presets for Pokemon', sanitizedSpeciesForme,
      '\n', 'presets', presets,
      '\n', 'format', format,
    );

    return presets;
  }

  const url = `${process.env.SMOGON_RANDOM_PRESETS_URL}/${format}.json`;

  l.debug(
    'fetchSmogonRandomPresets() -> await runtimeFetch()',
    '\n', 'url', url,
  );

  const response = await runtimeFetch(url);
  const data = <PkmnSmogonRandomPresets> await response.json();

  l.debug(
    'fetchSmogonRandomPresets() <- await runtimeFetch()',
    '\n', 'data', data,
  );

  if (!Object.keys(data || {}).length) {
    l.warn('received no Smogon presets!');

    return [];
  }

  if (!(format in presetCache)) {
    presetCache[format] = {};
  }

  Object.entries(data).forEach(([forme, preset]) => {
    const sanitizedForme = sanitizeSpeciesForme(forme);

    if (!Array.isArray(presetCache[format][sanitizedForme])) {
      presetCache[format][sanitizedForme] = [];
    }

    const calcdexPreset: CalcdexPokemonPreset = {
      name: 'Randoms',
      species: forme, // purposefully not sanitized
      level: preset?.level,
      ability: preset?.abilities?.[0],
      altAbilities: preset?.abilities,
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
      evs: preset?.evs,
    };

    calcdexPreset.calcdexId = calcPresetCalcdexId(calcdexPreset);

    const index = presetCache[format][sanitizedForme]
      .findIndex((p) => p.calcdexId === calcdexPreset.calcdexId);

    if (index > -1) {
      presetCache[format][sanitizedForme][index] = calcdexPreset;
    } else {
      presetCache[format][sanitizedForme].push(calcdexPreset);
    }
  });

  const presets = presetCache[format][sanitizedSpeciesForme];

  l.debug(
    'returning downloaded random presets for Pokemon', sanitizedSpeciesForme,
    '\n', 'presets', presets,
  );

  return presets;
};
