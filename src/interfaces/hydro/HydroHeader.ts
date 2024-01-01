import { type HydroDescriptor } from './HydroDescriptor';

/**
 * Common header for hydrated payloads.
 *
 * @since 1.1.6
 */
export interface HydroHeader {
  /**
   * Showdex version.
   *
   * @example '1.1.6'
   * @since 1.1.6
   */
  version: string;

  /**
   * Build name.
   *
   * @example 'showdex-v1.1.6-b188FC84C1A9-dev.chrome'
   * @since 1.1.6
   */
  build: string;

  /**
   * Build timestamp.
   *
   * * Value is an uppercased hexadecimal string numerically representing milliseconds since the Unix epoch.
   * * This refers to the time this specific bundle of Showdex was built.
   *
   * @example '188FC84C1A9'
   * @since 1.2.0
   */
  buildTimestamp: string;

  /**
   * Hydrated `buildTimestamp`.
   *
   * * Only exists if the `buildTimestamp` could be hydrated.
   *
   * @since 1.2.0
   */
  buildDate?: Date;

  /**
   * Build environment.
   *
   * * Will be `'development'` if `'dev'` is present in the build target part of the `build` string.
   *
   * @default 'production'
   * @since 1.2.0
   */
  buildEnvironment: 'development' | 'production';

  /**
   * Build target.
   *
   * * Indicates the platform the dehydrating Showdex bundle was built for.
   * * Will be `null` if the target couldn't be determined from the `build` string.
   *
   * @default null
   * @since 1.2.0
   */
  buildTarget: string;

  /**
   * Dehydration timestamp.
   *
   * * Value is an uppercased hexadecimal string numerically representing milliseconds since the Unix epoch.
   * * This typically refers to the time at which the payload was dehydrated, **not** the build date!
   *   - For the build date, refer to `buildTimestamp` & `buildDate`.
   *
   * @example '18904BAC42E'
   * @since 1.1.6
   */
  timestamp: string;

  /**
   * Hydrated `timestamp`.
   *
   * * Only exists if the dehydration `timestamp` could be hydrated.
   *
   * @since 1.1.6
   */
  date?: Date;

  /**
   * Payload descriptor.
   *
   * @example 'presets'
   * @since 1.1.6
   */
  descriptor: HydroDescriptor;

  /**
   * Whether the `descriptor` is a valid `HydroDescriptor`.
   *
   * @since 1.1.6
   */
  descriptorValid?: boolean;
}
