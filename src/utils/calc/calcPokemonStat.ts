import { type GenerationNum } from '@smogon/calc';
import { PokemonNatureBoosts } from '@showdex/consts/dex';
import { clamp } from '@showdex/utils/core';
import { detectGenFromFormat, detectLegacyGen } from '@showdex/utils/dex';

/**
 * Truncates `num` to the number of `bits`.
 *
 * * Note that `num` will be converted to `0` if not a valid number.
 *   - e.g., `'' >>> 0` is `0`, `null >>> 0` is `0`, `undefined >>> 0` is `0`.
 * * Additionally, any decimals will be dropped (i.e., similar behavior to `Math.floor()`).
 *   - e.g., `5.9995 >>> 0` is `5`.
 *
 * @see https://github.com/pkmn/ps/blob/bce04b4900d33386391162412cc4409442c6791d/data/index.ts#L37
 * @since 1.0.3
 */
const tr = (
  num: number,
  bits = 0,
): number => (
  bits
    ? (num >>> 0) % (2 ** bits)
    : (num >>> 0)
);

/**
 * Re-implemented `dex.stats.calc()` from `@pkmn/data`.
 *
 * * You can pass in the actual battle format (e.g., `'gen8ou'`) or a generation number (e.g., `8`)
 *   for the `format` argument.
 * * Note that this assumes that for legacy gens, the IVs are already converted from DVs.
 *   - Unlike in `@pkmn/data`, where the IV is converted into a DV, then converted into an IV again.
 *
 * @see https://github.com/pkmn/ps/blob/bce04b4900d33386391162412cc4409442c6791d/data/index.ts#L714-L730
 * @since 1.0.3
 */
export const calcPokemonStat = (
  format: GenerationNum | string,
  stat: Showdown.StatName,
  base: number,
  iv = 31,
  ev?: number,
  level = 100,
  nature?: Showdown.NatureName,
): number => {
  const gen = typeof format === 'string'
    ? detectGenFromFormat(format)
    : format;

  const legacy = detectLegacyGen(gen);
  const supportsAvs = typeof format === 'string' && format.includes('letsgo');
  // const supportsEvs = !legacy && !supportsAvs;

  const actualIv = clamp(0, legacy ? iv - (iv % 2 === 1 ? 1 : 0) : iv);
  const actualEv = clamp(0, ev ?? (legacy ? 252 : 0));
  const actualLevel = clamp(0, level, 100);

  if (stat === 'hp') {
    if (base === 1) {
      return base;
    }

    return supportsAvs
      ? tr(tr(2 * base + actualIv + 100) * (actualLevel / 100) + 10) + actualEv
      : tr(tr(2 * base + actualIv + tr(actualEv / 4) + 100) * (actualLevel / 100) + 10);
  }

  const value = tr(tr(2 * base + actualIv + tr(actualEv / 4)) * (actualLevel / 100) + 5);

  if (!legacy && nature && nature in PokemonNatureBoosts) {
    const [
      plus,
      minus,
    ] = PokemonNatureBoosts[nature];

    if (plus && stat === plus) {
      return tr(tr(value * 110, 16) / 100);
    }

    if (minus && stat === minus) {
      return tr(tr(value * 90, 16) / 100);
    }
  }

  return value;
};
