/**
 * All possible Showdex asset bundle entities.
 *
 * * How did this come *after* `ShowdexAssetBundleEntity` you may never ask ?
 *   - It was a string literal before!
 *
 * @since 1.2.4
 */
export const ShowdexAssetBundleEntities = [
  'locale',
  'presets',
  'tiers',
  'titles',
] as const;

/**
 * Describes what the bundled asset is.
 *
 * @since 1.2.1
 */
export type ShowdexAssetBundleEntity = typeof ShowdexAssetBundleEntities[number];

/**
 * Particular metadata about a particular loadable asset bundled with this particular build of Showdex.
 *
 * @since 1.2.1
 */
export interface ShowdexAssetBundle {
  /**
   * Bundle's ID.
   *
   * * Also should correspond to the file name.
   *
   * @example
   * ```ts
   * '05fa0b37-3873-45cc-afd2-ee37cda5d48b'
   * ```
   * @since 1.2.1
   */
  id: string;

  /**
   * Bundle's file extension.
   *
   * * Don't include the leading period.
   * * Falsy values will treat the file as extensionless.
   *
   * @example
   * ```ts
   * 'json'
   * ```
   * @since 1.2.1
   */
  ext?: string;

  /**
   * Bundle's tag / entity / type.
   *
   * @example
   * ```ts
   * 'presets'
   * ```
   * @since 1.2.1
   */
  ntt: ShowdexAssetBundleEntity;

  /**
   * Bundle's human-readable name.
   *
   * @example
   * ```ts
   * 'leaked secret gen10 threats'
   * ```
   * @since 1.2.1
   */
  name: string;

  /**
   * Optional label to display in UIs (particularly settings) over the `name`.
   *
   * @example
   * ```ts
   * 'CAP'
   * ```
   * @since 1.2.1
   */
  label?: string;

  /**
   * Bundle's author.
   *
   * @example
   * ```ts
   * 'Keith Choison <keith@tize.io>'
   * ```
   * @since 1.2.1
   */
  author?: string;

  /**
   * Bundle's optional description.
   *
   * @example
   * ```ts
   * 'im cap fr pls dont sue me'
   * ```
   * @since 1.2.1
   */
  desc?: string;

  /**
   * ISO 8601 timestamp of when this bundle was first introduced.
   *
   * @example
   * ```ts
   * '2024-01-04T11:27:19.228Z'
   * ```
   * @since 1.2.1
   */
  created: string;

  /**
   * ISO 8601 timestamp of when this bundle was last updated.
   *
   * @since 1.2.1
   */
  updated?: string;

  /**
   * Simple killswitch for preventing this bundle from loading.
   *
   * @since 1.2.1
   */
  disabled?: boolean;
}
