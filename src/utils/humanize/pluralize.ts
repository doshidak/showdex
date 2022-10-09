export type PluralizeNum = number | string;
export type PluralizeNumParser = (num: number) => string;
export type PluralizeWordParser = (word: string, num?: number) => string;

export interface PluralizeConfig {
  /**
   * Deliminating character used in `stems`.
   *
   * @default ':'
   * @since 1.0.3
   */
  delimiter?: string;

  /**
   * Fallback value for `num` should parsing fail.
   *
   * * Note that even if `printNum` is `false`, this value can still influence the resulting pluralized word.
   * * This value goes through `numParser`, if provided.
   *
   * @default 0
   * @since 1.0.3
   */
  defaultNumValue?: number;

  /**
   * Fallback value for the noun stem should splitting `stems` fail.
   *
   * * This value goes through `wordParser`, if provided.
   *
   * @default 0
   * @since 1.0.3
   */
  defaultWordValue?: string;

  /**
   * Whether `num` should be printed with the pluralized noun.
   *
   * * If this value is `false`, `formatNum`, `asLocaleString`, and `numParser` will have no effect.
   *
   * @default true
   * @since 1.0.3
   */
  printNum?: boolean;

  /**
   * Whether `num` should be formatted.
   *
   * * If this value is `true` (default), `num` will be formatted as a string.
   * * If this value is `false`, `asLocaleString` and `numParser` will have no effect.
   * * Has no effect if `printNum` is `false`.
   *
   * @default true
   * @since 1.0.3
   */
  formatNum?: boolean;

  /**
   * Whether `num` should be formatted in the client's locale string.
   *
   * * This functionality serves as the default number parser.
   * * Under-the-hood, `toLocaleString()` is called on `num` instead of `toString()`.
   * * Has no effect if:
   *   - `printNum` is `false`,
   *   - `formatNum` is `false`, and/or
   *   - `numParser` is provided.
   *
   * @default true
   * @since 1.0.3
   */
  asLocaleString?: boolean;

  /**
   * Parsing function for `num`, overriding the default number parser.
   *
   * * If provided, `asLocaleString` will have no effect.
   * * Has no effect if:
   *   - `printNum` is `false` and/or
   *   - `formatNum` is `false`.
   *
   * @since 1.0.3
   */
  numParser?: PluralizeNumParser;

  /**
   * Parsing function for the noun.
   *
   * * Value of the `word` function argument has already been pluralized.
   *
   * @since 1.0.3
   */
  wordParser?: PluralizeWordParser;
}

export type Pluralizer<T extends PluralizeNum | PluralizeNum[] = string> = (
  num: number | string,
  stems: string,
  config?: PluralizeConfig,
) => T;

/**
 * Returns a string containing the parsed number (unless `config.printNum` is `false`) and the pluralized noun.
 *
 * @example
 * ```ts
 * pluralize(1, 'apple:s'); // '1 apple'
 * pluralize(69420, 'apple:s'); // '69,420 apples'
 * pluralize(3, 'strawberr:ies:y', {
 *   numParser: (num) => num.toFixed(2),
 * }); // '3.00 strawberries'
 * pluralize(1, 'nex:i:us', { formatNum: false }); // '1 nexus'
 * pluralize(42069, 'nex:i:us', { asLocaleString: false }); // '42069 nexi'
 * pluralize(1, 'nex:i:us', {
 *   printNum: false, wordParser:
 *   (word) => ['destroy', word].join(' '),
 * }); // 'destroy nexus'
 * ```
 * @since 1.0.3
 */
export interface Pluralize extends Pluralizer<string> {
  /**
   * @returns An array containing the parsed number (unless `config.printNum` is `false`) and the pluralized noun.
   * @example
   * ```ts
   * pluralize(1, 'apple:s'); // ['1', 'apple']
   * pluralize(69420, 'apple:s'); // ['69,420', 'apples']
   * pluralize(3.5, 'strawberr:ies:y', {
   *   numParser: (num) => num.toFixed(2),
   * }); // ['3.50', 'strawberries']
   * pluralize(1, 'nex:i:us', { formatNum: false }); // [1, 'nexus']
   * pluralize(42069, 'nex:i:us', { asLocaleString: false }); // ['42069', 'nexi']
   * pluralize(1, 'nex:i:us', {
   *   printNum: false,
   *   wordParser: (word) => ['destroy', word].join(' '),
   * }); // ['destroy', 'nexus']
   * ```
   * @since 1.0.3
   */
  array: Pluralizer<PluralizeNum[]>;
}

const pluralizer: Pluralizer<PluralizeNum[]> = (num, stems, {
  delimiter = ':',
  defaultNumValue = 0,
  defaultWordValue = '',
  printNum = true,
  formatNum = true,
  asLocaleString = true,
  numParser,
  wordParser,
} = {}) => {
  // e.g., 'apple:s', 'radi:i:us', 'nex:i:us'
  const [
    stem = defaultWordValue,
    pluralAffix = '',
    singularAffix = '',
  ] = stems?.split?.(delimiter) || [];

  let parsedNum = num || defaultNumValue;

  if (typeof parsedNum === 'string') {
    parsedNum = Number(parsedNum) || defaultNumValue;
  }

  let word = `${stem}${parsedNum === 1 ? singularAffix : pluralAffix}`;

  if (typeof wordParser === 'function') {
    word = wordParser(word, parsedNum);
  }

  if (!printNum) {
    return [word];
  }

  if (formatNum) {
    const parser: PluralizeNumParser = typeof numParser === 'function' ?
      numParser :
      (n) => (asLocaleString ? n.toLocaleString() : n.toString());

    parsedNum = parser(parsedNum);
  }

  return [parsedNum, word];
};

/**
 * Pluralizes a noun, determined from the passed-in `stems` and `num` values.
 *
 * @author Keith Choison <keith@tize.io>
 * @param num Number of items.
 * @param stems Noun stem, plural affix, and an optional singular affix all within a single string, separated by `config.delimiter`.
 * @param config Optional configuration.
 * @returns Value containing the parsed number (unless `config.printNum` is `false`) and the pluralized noun.
 * @since 1.0.3
 */
export const pluralize: Pluralize = (
  num,
  stems,
  config,
) => pluralizer(num, stems, config)?.join(' ');

pluralize.array = (
  num,
  stems,
  config,
) => pluralizer(num, stems, {
  formatNum: false,
  ...config,
});
