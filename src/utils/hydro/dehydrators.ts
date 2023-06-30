import { type CalcdexPlayerKey, type CalcdexPlayerSide } from '@showdex/redux/store';
import { env } from '@showdex/utils/core';

/**
 * Dehydrated Showdex payload descriptors.
 *
 * @since 1.1.6
 */
export type ShowdexDehydratedDescriptor =
  | 'calcdex'
  | 'presets'
  | 'settings';

/**
 * Outputs standardized header information describing the dehydrated content.
 *
 * All dehydrated Showdex data should begin with this header, which follows the following format:
 *
 * ```
 * <opcode>:<value>[;<opcode>:<value>...]
 * ```
 *
 * Each *property* (i.e., `<opcode>:<value>`) is deliminated by a semicolon (`';'`).
 * Following properties are output by default:
 *
 * * `v`, representing the Showdex (v)ersion.
 * * `n`, representing the build (n)umber.
 * * `e`, representing the build (e)nvironment.
 * * `b`, representing the build target/(b)rowser.
 * * `t`, representing the dehydration (t)imestamp.
 *   - Like the build number, this is converted into a hexadecimal string from the millisecond
 *     timestamp since the Unix epoch.
 * * `d`, representing the payload (d)escriptor/type.
 *
 * Any other `<opcode>`'s will be dependent on the value of the `d` property.
 * For example, `d:presets` will expect additional properties like `u` & `p`.
 *
 * @example
 * ```ts
 * dehydrateHeader('presets');
 *
 * 'v:1.1.6;n:188FC84C1A9;e:dev;b:chrome;t:18904BAC42E;d:presets'
 * ```
 * @since 1.1.6
 */
export const dehydrateHeader = (
  descriptor: ShowdexDehydratedDescriptor,
  delimiter = ';',
): string => {
  if (!descriptor) {
    return null;
  }

  return [
    `v:${env('package-version', 'X.X.X')}`,
    `n:${env('build-date', '?')}`,
    `e:${__DEV__ ? 'dev' : 'prod'}`,
    `b:${env('build-target', '?')}`,
    `t:${Date.now().toString(16).toUpperCase()}`,
    `d:${descriptor}`,
  ].join(delimiter);
};

/**
 * Dehydrates a boolean `value` as `'y'` for `true` and `'n'` for `false`.
 *
 * @since 1.0.3
 */
export const dehydrateBoolean = (value: boolean): string => (value ? 'y' : 'n');

/**
 * Dehydrates a serializable `value`, defaulting to `'?'` if not serializable via `toString()`.
 *
 * * If `value` is detected to be a `boolean`, `value` will be passed to `dehydrateBoolean()`.
 *
 * @since 1.0.3
 */
export const dehydrateValue = (value: unknown): string => (
  typeof value === 'boolean'
    ? dehydrateBoolean(value)
    : value?.toString?.().replace(/(?:,|;|\|)/g, '') || '?'
);

/**
 * Dehydrates an array `value` by dehydrating each element in `value` and
 * joining the resulting map with the `delimiter`.
 *
 * @example
 * ```ts
 * dehydrateArray(['Ice', 'Ghost']);
 *
 * 'Ice/Ghost'
 * ```
 * @since 1.0.3
 */
export const dehydrateArray = (
  value: unknown[],
  delimiter = '/',
): string => value?.map?.((v) => dehydrateValue(v)).join(delimiter);

/**
 * Dehydrates a stats table `value`, joining each dehydrated stat value with the `delimiter`.
 *
 * @example
 * ```ts
 * dehydrateStatsTable({
 *   hp: 31,
 *   atk: 0,
 *   def: 31,
 *   spa: 31,
 *   spd: 31,
 *   spe: 31,
 * });
 *
 * '31/0/31/31/31/31'
 * ```
 * @since 1.0.3
 */
export const dehydrateStatsTable = (
  value: Showdown.StatsTable,
  delimiter = '/',
): string => [
  value?.hp,
  value?.atk,
  value?.def,
  value?.spa,
  value?.spd,
  value?.spe,
].map((v) => dehydrateValue(v)).join(delimiter);

/**
 * Dehydrates a player side `value`, filtering out properties with falsy values and
 * joining the resulting dehydrated property values with the `delimiter`.
 *
 * * Key and value of each property is deliminated by an equals (`'='`).
 * * Does not dehydrate the `conditions` object at the moment.
 *
 * @example
 * ```ts
 * dehydratePlayerSide({
 *   spikes: 0,
 *   isSR: true,
 *   isReflect: true,
 *   isLightScreen: false,
 *   isAuroraVeil: false,
 * });
 *
 * 'isSR=y/isReflect=y'
 * ```
 * @since 1.0.3
 */
export const dehydratePlayerSide = (
  value: CalcdexPlayerSide,
  delimiter = '/',
): string => Object.entries(value || {})
  .filter((e) => !!e?.[0] && e[0] !== 'conditions' && !!e[1])
  .map(([k, v]) => `${k}=${dehydrateValue(v)}`)
  .join(delimiter);

/**
 * Dehydrates a per-side settings `value`.
 *
 * @example
 * ```ts
 * dehydratePerSide({
 *   auth: false,
 *   p1: true,
 *   p2: true,
 *   p3: true,
 *   p4: true,
 * });
 *
 * 'n/y/y/y/y'
 * ```
 * @example
 * ```ts
 * dehydratePerSide({
 *   auth: [],
 *   p1: ['iv', 'ev'],
 *   p2: ['iv', 'ev'],
 *   p3: ['iv', 'ev'],
 *   p4: ['iv', 'ev'],
 * });
 *
 * '/iv,ev/iv,ev/iv,ev/iv,ev'
 * ```
 * @since 1.0.3
 */
export const dehydratePerSide = (
  value: Record<'auth' | CalcdexPlayerKey, unknown>,
  delimiter = '/',
  arrayDelimiter = ',',
): string => Object.keys(value || {})
  .sort()
  .map((key: 'auth' | CalcdexPlayerKey) => (
    Array.isArray(value[key])
      ? dehydrateArray(value[key] as unknown[], arrayDelimiter)
      : dehydrateValue(value[key])
  ))
  .join(delimiter);
