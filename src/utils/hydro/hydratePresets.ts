import { type GenerationNum } from '@smogon/calc';
import {
  HydroPresetsDefaultName,
  HydroPresetsDehydrationMap,
  HydroPresetsHydrationMap,
} from '@showdex/consts/hydro';
import {
  type CalcdexPokemonAlt,
  type CalcdexPokemonPreset,
  type CalcdexPokemonPresetSource,
} from '@showdex/interfaces/calc';
import { type HydroPresets } from '@showdex/interfaces/hydro';
// import { logger } from '@showdex/utils/debug';
import { detectGenFromFormat, getGenlessFormat } from '@showdex/utils/dex';
import { flattenAlt, flattenAlts } from '@showdex/utils/presets';
import { hydrateHeader } from './hydrateHeader';
import { hydrateNumber, hydrateValue } from './hydratePrimitives';
import { hydrateSpread } from './hydrateSpread';

// const l = logger('@showdex/utils/hydro/hydratePresets()');

/**
 * Hydrates a string `value` into a `CalcdexPokemonAlt<T>`.
 *
 * @since 1.1.6
 */
export const hydrateAlt = <T extends string>(
  value: string,
  delimiter = '@',
): CalcdexPokemonAlt<T> => {
  if (!value) {
    return null;
  }

  if (value.includes(delimiter)) {
    const [
      name,
      usage,
    ] = value.split(delimiter);

    const parsedUsage = hydrateNumber(usage);

    if (name && typeof parsedUsage === 'number' && parsedUsage >= 0) {
      return [
        name as T,
        parsedUsage,
      ];
    }
  }

  return value as T;
};

/**
 * Hydrates a dehydrated `value` into a hydrated `CalcdexPokemonPreset`.
 *
 * * `null` will be returned if hydration fails for any reason.
 *   - This includes undetected or invalid `calcdexId`'s, `gen`'s (from `format`'s) & `speciesForme`'s
 *     from the dehydrated `value`.
 * * Note that for `ivs` & `evs` (of applicable gens), only provided stats will be hydrated.
 *   - It is up to the caller to ensure that the remaining unspecified stats have their default values.
 *   - IVs in gens 3+, for instance, have a default value of 31 (or 30 for legacy gens, converting from DVs).
 *
 * @example
 * ```ts
 * hydratePreset('cid~85b295f0-...,src~smogon,nom~Wallbreaker,...,evs~84/0/84/84/84/84');
 *
 * CalcdexPokemonPreset {
 *   calcdexId: '85b295f0-803a-583d-97ef-92cd600050b6',
 *   id: '85b295f0-803a-583d-97ef-92cd600050b6',
 *   source: 'smogon',
 *   name: 'Wallbreaker',
 *   gen: 9,
 *   format: 'gen9randombattle',
 *   speciesForme: 'Hatterene',
 *   nickname: null,
 *   // ... other properties ... //
 *   evs: {
 *     hp: 84,
 *     atk: 0,
 *     def: 84,
 *     spa: 84,
 *     spd: 84,
 *     spe: 84,
 *   },
 * }
 * ```
 * @since 1.1.6
 */
export const hydratePreset = (
  value: string,
  delimiter = ',',
  opcodeDelimiter = '~',
  arrayDelimiter = '/',
  altDelimiter = '@',
): CalcdexPokemonPreset => {
  if (!value?.includes(delimiter) || !value.includes(`${HydroPresetsDehydrationMap.calcdexId}${opcodeDelimiter}`)) {
    return null;
  }

  const output: CalcdexPokemonPreset = {
    calcdexId: null,
    id: null,
    source: null,
    name: HydroPresetsDefaultName,
    gen: null,
    format: null,
    speciesForme: null,
  };

  const parts = value.split(delimiter);

  // should at least have 2 elements: calcdexId (cid) & speciesForme (fme)
  if (parts.length < 3) {
    return null;
  }

  parts.forEach((part) => {
    // must follow: `<opcode>~<value>`,
    // where <opcode> is arbitrarily 3 strictly-enforced case-insensitive letters
    // & <value> is at least length 1 (i.e., can't be 'fuk-' -- shouldn't have been included!)
    const partRegex = new RegExp(`^([a-z]{3})${opcodeDelimiter}(.+)$`, 'i');

    if (!partRegex.test(part)) {
      return;
    }

    const [
      ,
      opcode,
      partValue,
    ] = partRegex.exec(part) || [];

    if (!opcode || !(opcode in HydroPresetsHydrationMap) || !partValue) {
      return;
    }

    const key = HydroPresetsHydrationMap[opcode];

    if (!key) {
      return;
    }

    // hydrate most properties here, but some like `id` & `ability` will be populated after
    switch (key) {
      case 'format': {
        output.gen = detectGenFromFormat(partValue);
        output.format = getGenlessFormat(partValue);

        break;
      }

      case 'teraTypes':
      case 'altAbilities':
      case 'altItems':
      case 'altMoves': {
        if (!Array.isArray(output[key])) {
          output[key] = [];
        }

        partValue.split(arrayDelimiter).forEach((currentValue) => {
          if (!currentValue) {
            return;
          }

          // note: TypeScript will intersect (`&`) all possible types of the `key` union because
          // it's genius af, so obviously nothing satisfies '???' & AbilityName & ItemName & MoveName,
          // 'Normal' & AbilityName & ItemName & MoveName, ... etc.; type asserting output[key] is
          // required here to make TypeScript happy >:(
          (output[key] as (typeof output[typeof key][0])[]).push(
            currentValue.includes(altDelimiter)
              ? hydrateAlt<Extract<typeof output[typeof key][0], string>>(
                currentValue,
                altDelimiter,
              )
              : hydrateValue<Extract<typeof output[typeof key][0], string>>(currentValue),
          );
        });

        break;
      }

      case 'spreads': {
        output[key] = partValue.split(arrayDelimiter)
          .map((currentValue) => hydrateSpread(currentValue, {
            format: output.gen,
            delimiter: '|',
            altDelimiter,
          }));

        const [firstSpread] = output[key];

        output.nature = firstSpread?.nature;
        output.ivs = { ...firstSpread?.ivs };
        output.evs = { ...firstSpread?.evs };

        break;
      }

      default: {
        output[key] = hydrateValue(partValue);

        break;
      }
    }
  });

  if (!output.calcdexId || !output.gen || !output.format || !output.speciesForme) {
    return null;
  }

  // populate id, gen, ability, item & moves properties
  output.id = output.calcdexId;

  if (output.altAbilities?.length) {
    output.ability = flattenAlt(output.altAbilities[0]);
  }

  if (output.altItems?.length) {
    output.item = flattenAlt(output.altItems[0]);
  }

  if (output.altMoves?.length) {
    /**
     * @todo update this when we support more than 4 moves
     */
    output.moves = flattenAlts(output.altMoves.slice(0, 4));
  }

  // jk one more
  if (output.name === HydroPresetsDefaultName) {
    output.name += ` (${output.calcdexId.split('-')[0] || 'HUH'})`;
  }

  return output;
};

/**
 * Hydrates an entire dehydrated preset `value` string.
 *
 * * Optionally provide a `format` to filter which presets get hydrated.
 *   - `GenerationNum` types for `format` will filter by generation.
 *   - `string` types will filter by `format`, such as `'gen9randombattle'`.
 *   - Providing no `format` will hydrate all presets, which may affect performance.
 * * You can also provide a `source` to only hydrate presets from the same `CalcdexPokemonPresetSource`.
 * * Doesn't determine if the `value` is considered "fresh" since this is designed to be use-case agnostic.
 *   - i.e., Caching may not be the only use-case for preset serialization!
 *   - Callers should perform additional checks on their own.
 * * Note that even if hydration was successful, the returned `presets[]` can still be empty!
 * * `null` will be returned if hydration fails for whatever reason.
 *
 * @since 1.1.6
 */
export const hydratePresets = (
  value: string,
  format?: GenerationNum | string,
  source?: CalcdexPokemonPresetSource,
  delimiter = ';',
  opcodeDelimiter = ':',
  presetDelimiter = ',',
  presetOpcodeDelimiter = '~',
  presetArrayDelimiter?: string,
  presetAltDelimiter?: string,
): HydroPresets => {
  if (!value?.includes(delimiter)) {
    return null;
  }

  const [
    header,
    remaining,
  ] = hydrateHeader(value, delimiter, opcodeDelimiter);

  if (!header?.descriptorValid || !remaining?.length) {
    return null;
  }

  const output: HydroPresets = {
    ...header,
    presets: null,
  };

  // create the format filter preset opcode, if provided
  const parsedFormat = typeof format === 'number'
    ? (format > 0 ? `gen${format}` : null)
    : format;

  const randoms = parsedFormat?.includes('random');

  // e.g., format = 9 -> formatFilter = 'fmt~gen9'
  // format = 'gen9randombattle' -> formatFilter = 'fmt~gen9randombattle'
  const formatDeclaration = `${HydroPresetsDehydrationMap.format}${presetOpcodeDelimiter}`;
  const randomsRegex = new RegExp(`${formatDeclaration}gen\\d.*random`, 'i');
  const formatFilter = parsedFormat ? `${formatDeclaration}${parsedFormat}` : null;
  const sourceFilter = source ? `${HydroPresetsDehydrationMap.source}${presetOpcodeDelimiter}${source}` : null;

  output.presets = remaining
    .filter((p) => (
      p?.startsWith(`p${opcodeDelimiter}`) // all dehydrated presets must start with this to indicate it's a dehydrated preset (duh)
        && (!formatFilter || ( // pass if formatFilter is falsy (due to an invalid `format` arg, e.g., wasn't provided)
          p.includes(formatFilter) // at this point, formatFilter is truthy, so pass if this contains the dehydrated format
            // pass if the format is randoms & the dehydrated preset contains the word 'random' in its dehydrated format
            // otherwise, make sure the dehydrated format doesn't contain random! (don't want it showing up in an OU game, for instance)
            && (randoms ? randomsRegex.test(p) : !randomsRegex.test(p))
        ))
        // pass if sourceFilter is falsy (due to an invalid `source` arg) or this contains the dehydrated source
        && (!sourceFilter || p.includes(sourceFilter))
    ))
    .map((p) => hydratePreset(
      p.replace(`p${opcodeDelimiter}`, ''), // e.g., 'p:cid~...' -> 'cid~...'
      presetDelimiter,
      presetOpcodeDelimiter,
      presetArrayDelimiter,
      presetAltDelimiter,
    ))
    .filter(Boolean);

  return output;
};
