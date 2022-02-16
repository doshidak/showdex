import { logger } from '@showdex/utils/debug';
import type { DeepPartial } from '@pkmn/smogon';
import type { PokemonSet } from '@pkmn/types';
import type { CalcdexPokemonPreset } from './CalcdexReducer';
import { calcPresetCalcdexId } from './calcCalcdexId';

const l = logger('Calcdex/sanitizePresets');

export const sanitizePresets = (smogonPresets: DeepPartial<PokemonSet>[]): CalcdexPokemonPreset[] => {
  if (!Array.isArray(smogonPresets)) {
    return [];
  }

  const validSmogonPresets = smogonPresets.filter((p) => p?.name);

  if (!validSmogonPresets.length) {
    l.warn(
      'smogonPresets is empty after filtering for non-falsy Pokemon set names',
      '\n', 'validSmogonPresets', validSmogonPresets,
      '\n', 'smogonPresets', smogonPresets,
    );

    return [];
  }

  const sanitizedPresets: CalcdexPokemonPreset[] = validSmogonPresets.map((smogonPreset) => {
    const preset = <CalcdexPokemonPreset> { ...smogonPreset };

    Object.entries(preset)
      .filter((e) => !e?.[1] && !['string', 'number', 'boolean'].includes(typeof e?.[1]))
      .forEach(([key]) => { delete preset[key]; });

    // generate calcdexId
    preset.calcdexId = calcPresetCalcdexId(preset);

    return preset;
  });

  l.debug(
    'returning sanitized presets from input', smogonPresets,
    '\n', 'sanitizedPresets', sanitizedPresets,
  );

  return sanitizedPresets;
};
