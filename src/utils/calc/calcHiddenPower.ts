import { detectGenFromFormat } from '@showdex/utils/battle';
import type { GenerationNum } from '@smogon/calc';
import type { CalcdexPokemon } from '@showdex/redux/store';
import { convertIvToLegacyDv } from './convertLegacyStats';

/**
 * Internal helper function that returns the MSB (Most Significant Bit).
 *
 * * Assumes BE (Big-Endian), so the MSB is leftmost and LSB (Least Significant Bit) is rightmost.
 * * Does not use bitwise operators, but some JavaScript `String` manipulation tricks.
 *   - Alternatively could do `n < 8 ? 0 : 1`, which might be slightly faster lol.
 *
 * @example
 * ```ts
 * // 10 -> 1010
 * // MSB ~~^  ^~~ LSB
 * msb(10);
 *
 * 1
 * ```
 * @default 0
 * @since 1.0.4
 */
const msb = (
  n: number,
  bits = 4,
): number => Number(n?.toString?.(2).padStart(bits, '0').charAt(0)) || 0;

/**
 * Internal helper function that returns the second LSB (Least Significant Bit).
 *
 * * Assumes BE (Big-Endian), so the MSB is leftmost and LSB (Least Significant Bit) is rightmost.
 * * Does not use bitwise operators, but some JavaScript `String` manipulation tricks.
 *   - Alternatively could do `[2, 3].includes(n % 4) ? 1 : 0`, which might be slightly faster lol.
 *
 * @example
 * ```ts
 * // 29 -> 0001 1101
 * // MSB ~~^      ^~~ 2nd LSB
 * lsb2(29);
 *
 * 0
 * ```
 * @default 0
 * @since 1.0.4
 */
const lsb2 = (
  n: number,
  bits = 8,
): number => Number(n?.toString?.(2).padStart(bits, '0').slice(-2, -1)) || 0;

/**
 * Calculates the base power of *Hidden Power*.
 *
 * * In gen 2, BP can range from `[31, 70]`, both inclusive, based on the Pokemon's DVs.
 * * In gens 3-5, BP can range from `[30, 70]`, both inclusive, based on the Pokemon's IVs.
 * * In gens 6+, BP is always `60`.
 *
 * @example
 * ```ts
 * calcHiddenPower('gen3ou', {
 *   speciesForme: 'Pikachu',
 *   ...,
 *   ivs: {
 *     hp: 30,
 *     atk: 31,
 *     def: 31,
 *     spa: 30,
 *     spd: 31,
 *     spe: 31,
 *   },
 * });
 *
 * 70
 * ```
 * @default 0
 * @see https://bulbapedia.bulbagarden.net/wiki/Hidden_Power_(move)/Calculation
 * @since 1.0.4
 */
export const calcHiddenPower = (
  format: string | GenerationNum,
  pokemon: CalcdexPokemon,
): number => {
  const gen = typeof format === 'string'
    ? detectGenFromFormat(format)
    : format;

  // gen 1 does not have Hidden Power (legally)
  // (hopefully there isn't a "gen1nationaldex" format LOL)
  if (gen < 2) {
    return 0;
  }

  // from gens 6+, BP is always 60
  if (gen > 5) {
    return 60;
  }

  // handle gen 2 on its own since it still uses DVs
  if (gen === 2) {
    const atkDv = convertIvToLegacyDv(pokemon?.ivs?.atk || 0);
    const defDv = convertIvToLegacyDv(pokemon?.ivs?.def || 0);
    const spcDv = convertIvToLegacyDv(pokemon?.ivs?.spa || pokemon?.ivs?.spd || 0);
    const speDv = convertIvToLegacyDv(pokemon?.ivs?.spe || 0);

    // HP_power = floor(((5v + Z) / 2) + 5w + 10x + 20y) + 31
    const v = msb(spcDv);
    const w = msb(speDv);
    const x = msb(defDv);
    const y = msb(atkDv);
    const Z = spcDv % 4;

    return Math.floor((((5 * v) + Z) / 2) + (5 * w) + (10 * x) + (20 * y)) + 31;
  }

  // at this point, we should be gens 3-5
  // HP_power = floor(((u + 2v + 4w + 8x + 16y + 32z) * 40) / 63) + 30
  const u = lsb2(pokemon?.ivs?.hp);
  const v = lsb2(pokemon?.ivs?.atk);
  const w = lsb2(pokemon?.ivs?.def);
  const x = lsb2(pokemon?.ivs?.spe);
  const y = lsb2(pokemon?.ivs?.spa);
  const z = lsb2(pokemon?.ivs?.spd);

  return Math.floor(((u + (2 * v) + (4 * w) + (8 * x) + (16 * y) + (32 * z)) * 40) / 63) + 30;
};
