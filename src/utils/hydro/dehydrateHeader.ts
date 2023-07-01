import { type HydroDescriptor } from '@showdex/interfaces/hydro';
import { env } from '@showdex/utils/core';
import { dehydrateDate } from './dehydratePrimitives';

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
 * * `v`, representing the Showdex version.
 * * `@`, representing the build name.
 * * `#`, representing the dehydration timestamp.
 *   - Converted into an uppercased hexadecimal string from the millisecond timestamp since the Unix epoch.
 * * `$`, representing the payload descriptor/type.
 *
 * Any additional `<opcode>`'s will be dependent on the value of the `$` property.
 * For example, `$:presets` will expect additional properties like `u` & `p`.
 *
 * @example
 * ```ts
 * dehydrateHeader('presets');
 *
 * 'v:1.1.6;@:showdex-v1.1.6-b188FC84C1A9-dev.chrome;#:18904BAC42E;$:presets'
 * ```
 * @since 1.1.6
 */
export const dehydrateHeader = (
  descriptor: HydroDescriptor,
  delimiter = ';',
): string => (!descriptor ? null : [
  `v:${env('package-version', 'X.X.X')}`,
  `@:${env('build-name', '?').replace(new RegExp(delimiter, 'g'), '')}`,
  `#:${dehydrateDate()}`,
  `$:${descriptor}`,
].join(delimiter));
