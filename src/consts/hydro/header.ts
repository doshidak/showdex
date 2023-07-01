/**
 * Payload descriptors.
 *
 * * This is the part of the common header that describes the payload type.
 *
 * @since 1.1.6
 */
export enum HydroDescriptor {
  Calcdex = 'calcdex',
  Presets = 'presets',
  Settings = 'settings',
}

/**
 * Common header for dehydrated payloads.
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
  version?: string;

  /**
   * Build name.
   *
   * @example 'showdex-v1.1.6-b188FC84C1A9-dev.chrome'
   * @since 1.1.6
   */
  build?: string;

  /**
   * Raw dehydration timestamp.
   *
   * * Typically should be the millisecond timestamp since the Unix epoch,
   *   converted into an uppercased hexadecimal string.
   *
   * @example '18904BAC42E'
   * @since 1.1.6
   */
  timestamp?: string;

  /**
   * Dehydrated `Date`.
   *
   * * Only exists if the dehydration timestamp could be hydrated & is valid.
   * * This is the hydrated version of `timestamp` as a `Date` object.
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
  descriptor?: HydroDescriptor;

  /**
   * Whether the `descriptor` is a valid `HydroDescriptor`.
   *
   * @since 1.1.6
   */
  descriptorValid?: boolean;
}
