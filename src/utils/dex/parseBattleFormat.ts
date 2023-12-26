import { type GenerationNum } from '@smogon/calc';
import { FormatLabels, FormatSuffixes } from '@showdex/consts/dex';
import { detectGenFromFormat } from './detectGenFromFormat';

/**
 * Parsed parts of a Showdown battle format.
 *
 * @since 1.1.7
 */
export interface ShowdownParsedFormat {
  /**
   * Raw battle format.
   *
   * * ... *it's focking rawww* ...
   *
   * @example 'gen9vgc2023regulationebo3'
   * @since 1.1.7
   */
  raw: string;

  /**
   * Generation number.
   *
   * @example 9
   * @since 1.1.7
   */
  gen: GenerationNum;

  /**
   * Gen-less format.
   *
   * @example 'vgc2023regulationebo3'
   * @since 1.1.7
   */
  format: string;

  /**
   * Base format, which is the gen-less & suffix-less format.
   *
   * @example 'vgc2023'
   * @since 1.1.7
   */
  base: string;

  /**
   * Label to display in the user.
   *
   * @example 'VGC 2023'
   * @since 1.1.7
   */
  label: string;

  /**
   * Parsed format suffixes.
   *
   * @example
   * ```ts
   * [
   *   ['regulatione', 'Reg E'],
   *   ['bo3', 'Bo3'],
   * ]
   * ```
   * @since 1.1.7
   */
  suffixes: [raw: string, label: string][];
}

/**
 * Pass in a `format`, any `format` & it'll magically chop it up before your very eyes.
 *
 * * Primarily designed for UI rendering stuff, hence all of the parsed labels.
 *   - But is also used in populating the battle state, particularly the `subFormats[]`.
 * * `label` will contain a parsed label if the resulting `base` is defined as a key in `FormatLabels`.
 *   - Otherwise, it'll equal `base`, all sad & unformatted-like.
 * * Boring fact: "`parseFormat`" sounded too ambiguous, hence `parseBattleFormat()`.
 *   - Something like "`detectGenFromBattleFormat`" or "`getGenlessBattleFormat`" would be a mouthful, so L on this
 *     slight deviance of the naming convention lol.
 *   - ... *ahh yeees, my favorite function, "`formatFormat`"*
 *   - (un-ironically makes sense in this context actually LOL)
 * * Guaranteed to return an object with `null` primitives.
 *   - As of v1.2.0, as part of a performance optimization, `suffixes[]` is guaranteed to be an empty array only when
 *     `config.populateSuffixes` is `true`, `null` otherwise.
 *
 * @example
 * ```ts
 * parseBattleFormat('gen9vgc2023regulationebo3', {
 *   populateSuffixes: true,
 * });
 *
 * {
 *   raw: 'gen9vgc2023regulationebo3',
 *   gen: 9,
 *   format: 'vgc2023regulationebo3',
 *   base: 'vgc2023',
 *   label: 'VGC 2023',
 *   suffixes: [
 *     ['regulatione', 'Reg E'],
 *     ['bo3', 'Bo3'],
 *   ],
 * } as ShowdownParsedFormat
 * ```
 * @since 1.1.7
 */
export const parseBattleFormat = (
  format: string,
  config?: {
    populateSuffixes?: boolean;
  },
): ShowdownParsedFormat => {
  const output: ShowdownParsedFormat = {
    raw: format,
    gen: detectGenFromFormat(format),
    format: null,
    base: null,
    label: null,
    suffixes: null,
  };

  if (!output.gen) {
    return output;
  }

  const {
    populateSuffixes,
  } = config || {};

  if (populateSuffixes) {
    output.suffixes = [];
  }

  // e.g., 'gen9vgc2023regulationebo3' -> 'vgc2023regulationebo3'
  output.format = output.raw.replace(`gen${output.gen}`, '');

  // destructively chunk the format down to its base format
  output.base = output.format;

  // check if we're already gucci
  if (output.base in FormatLabels) {
    output.label = FormatLabels[output.base];

    return output;
  }

  FormatSuffixes.forEach(([
    regex,
    replacement,
  ]) => {
    // e.g., rawSuffix = 'regulatione'
    const [rawSuffix] = regex.exec(output.base) || [];

    if (!rawSuffix) {
      return;
    }

    // e.g., ['regulatione', 'Reg E']
    if (populateSuffixes) {
      output.suffixes.push([
        rawSuffix,
        rawSuffix.replace(regex, replacement),
      ]);
    }

    // e.g., 'vgc2023regulationebo3' -> 'vgc2023bo3'
    output.base = output.base.replace(rawSuffix, '');
  });

  output.label = output.base in FormatLabels
    ? FormatLabels[output.base]
    : output.base;

  return output;
};
