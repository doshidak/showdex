import { type CalcdexPokemonPreset } from '@showdex/redux/store';
import { detectGenFromFormat } from '@showdex/utils/battle';
import { reverseObjectKv } from '@showdex/utils/core';
import { flattenAlt, flattenAlts } from '@showdex/utils/presets';
import { DehydrationPresetMap } from './dehydratePreset';
import { hydrateAlt, hydrateValue, hydrateStatsTable } from './hydrators';

/**
 * Reverse mapping of `string` opcodes to their `CalcdexPokemonPreset` properties.
 *
 * @example
 * ```ts
 * HydrationPresetMap.cid // 'calcdexId'
 * ```
 * @since 1.1.6
 */
const HydrationPresetMap = reverseObjectKv(DehydrationPresetMap);

/**
 * lol
 *
 * @since 1.1.6
 */
const HydrationPresetDefaultName = 'de_cache';

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
  if (!value?.includes(delimiter) || !value.includes(`${DehydrationPresetMap.calcdexId}${opcodeDelimiter}`)) {
    return null;
  }

  const output: CalcdexPokemonPreset = {
    calcdexId: null,
    id: null,
    source: null,
    playerName: null,
    name: HydrationPresetDefaultName,
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

    if (!opcode || !(opcode in HydrationPresetMap) || !partValue) {
      return;
    }

    const key = HydrationPresetMap[opcode];

    if (!key) {
      return;
    }

    // hydrate most properties here, but some like `id` & `ability` will be populated after
    switch (key) {
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

      case 'ivs':
      case 'evs': {
        // e.g., partValue = '84/0/84/84/84/84'
        // (also technically not an array, but everyone knows what those obscure numbers mean!)
        if (partValue.includes(arrayDelimiter)) {
          output[key] = hydrateStatsTable(partValue);
        }

        break;
      }

      default: {
        output[key] = hydrateValue(partValue);

        break;
      }
    }
  });

  if (!output.calcdexId || !output.format || !output.speciesForme) {
    return null;
  }

  // populate id, gen, ability, item & moves properties
  output.id = output.calcdexId;
  output.gen = detectGenFromFormat(output.format);

  if (!output.gen) {
    return null;
  }

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
  if (output.name === HydrationPresetDefaultName) {
    output.name += ` (${output.calcdexId.split('-')[0] || 'HUH'})`;
  }

  return output;
};
