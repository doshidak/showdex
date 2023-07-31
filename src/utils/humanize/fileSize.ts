export interface FileSizeHumanizerConfig {
  /**
   * Determines the number of decimal places to output.
   *
   * @default 2
   * @since 1.1.6
   */
  precision?: number;

  /**
   * If `true`, 1 KiB = 1024 B; otherwise, 1 KB = 1000 B.
   *
   * @default true
   * @since 1.1.6
   */
  useBinary?: boolean;

  /**
   * If `true`, the *i* in *KiB* won't be printed.
   *
   * * Has no effect if `useBinary` is `false`.
   *
   * @default false
   * @since 1.1.6
   */
  omitSymbolPrefix?: boolean;
}

// for decimal (metric), use kilo = 1000, symbol = 'B', and symbolPrefix = ''
// for binary (JEDEC/IEC), use kilo = 1024, symbol = 'B', and symbolPrefix = 'i'
// (WARNING: the values of each property are thresholds, meaning up to that value [exclusive])
const createBytesTable = (kilo = 1024, symbol = 'B', symbolPrefix = 'i') => ({
  [symbol]: kilo, // byte (B)
  [`K${symbolPrefix}${symbol}`]: kilo ** 2, // kilobyte (metric [kB]/JEDEC [KB]) / kibibyte (IEC [KiB])
  [`M${symbolPrefix}${symbol}`]: kilo ** 3, // megabyte (metric [MB]/JEDEC [MB]) / mebibyte (IEC [MiB])
  [`G${symbolPrefix}${symbol}`]: kilo ** 4, // gigabyte (metric [GB]/JEDEC [GB]) / gibibyte (IEC [GiB])
  [`T${symbolPrefix}${symbol}`]: kilo ** 5, // terabyte (metric [TB]) / tebibyte (IEC [TiB])
  [`P${symbolPrefix}${symbol}`]: kilo ** 6, // petabyte (metric [PB]) / pebibyte (IEC [PiB])
  [`E${symbolPrefix}${symbol}`]: kilo ** 7, // exabyte (metric [EB]) / exbibyte (IEC [EiB])
});

/**
 * Takes in a file size (in bytes) & outputs the size as a human-readable string.
 *
 * @param bytes Numerical value representing the file's size (in bytes).
 * @param config Optional configuration.
 * @returns Human-readable file size, or `null` if `bytes` could not be parsed into a number.
 * @example
 * ```ts
 * fileSize(4992507); // '4.76 MiB'
 * fileSize(4992507, { omitSymbolPrefix: true }); // '4.76 MB'
 * fileSize(4992507, { useBinary: false }); // '4.99 MB'
 * fileSize('4992507'); // '4.76 MiB'
 * fileSize('a'); // null
 * ```
 * @since 1.1.6
 */
export const fileSize = (
  bytes: number | string,
  config?: FileSizeHumanizerConfig,
): string => {
  const {
    precision = 2,
    useBinary = true,
    omitSymbolPrefix = false,
  } = config || {};

  const parsedBytes = (typeof bytes === 'string' ? parseInt(bytes, 10) : bytes) || -1;

  if (parsedBytes < 0) {
    return null;
  }

  const kilo = useBinary ? 1024 : 1000;
  const symbol = 'B';
  const symbolPrefix = useBinary && !omitSymbolPrefix ? 'i' : '';

  const table = createBytesTable(kilo, symbol, symbolPrefix);

  const [
    unit,
    threshold,
  ] = Object.entries(table).find(([, unitThreshold]) => parsedBytes < unitThreshold);

  const unitDivisor = threshold / kilo;

  // if the unitDivisor is 1, this means the units are still in bytes, so don't show
  // any decimals (makes no sense to show '921.00 B', for instance)
  const convertedSize = unitDivisor === 1
    ? parsedBytes
    : (parsedBytes / unitDivisor).toFixed(precision);

  return `${convertedSize} ${unit}`;
};
