/**
 * Describes what the bundled asset is.
 *
 * @since 1.2.1
 */
export type ShowdexAssetBundleTag =
  | 'locale'
  | 'presets';

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
   * @example '05fa0b37-3873-45cc-afd2-ee37cda5d48b'
   * @since 1.2.1
   */
  id: string;

  /**
   * Bundle's file extension.
   *
   * * Don't include the leading period.
   * * Falsy values will treat the file as extensionless.
   *
   * @example 'json'
   * @since 1.2.1
   */
  ext?: string;

  /**
   * Bundle's tag.
   *
   * @example 'presets'
   * @since 1.2.1
   */
  tag: ShowdexAssetBundleTag;

  /**
   * Bundle's human-readable name.
   *
   * @example 'leaked secret gen10 threats'
   * @since 1.2.1
   */
  name: string;

  /**
   * Optional label to display in UIs (particularly settings) over the `name`.
   *
   * @example 'CAP'
   * @since 1.2.1
   */
  label?: string;

  /**
   * Bundle's author.
   *
   * @example 'Keith Choison <keith@tize.io>'
   * @since 1.2.1
   */
  author?: string;

  /**
   * Bundle's optional description.
   *
   * @description 'im cap fr pls dont sue me'
   * @since 1.2.1
   */
  description?: string;

  /**
   * ISO 8601 timestamp of when this bundle was first introduced.
   *
   * @example '2024-01-04T11:27:19.228Z'
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
