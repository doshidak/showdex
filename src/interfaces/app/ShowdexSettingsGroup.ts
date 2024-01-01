/**
 * All available groups in the `ShowdexSettings`.
 *
 * @since 1.2.0
 */
export const ShowdexSettingsGroups = [
  'showdex',
  'hellodex',
  'calcdex',
  'honkdex',
  'showdown',
] as const;

/**
 * Name for the group of settings of a particular Showdex module.
 *
 * * Primarily used as keys in Showdex's IndexedDB settings object store.
 * * Note that `'showdex'` is a pseudo-group as its properties exist in the `ShowdexSettings` root itself.
 *
 * @since 1.2.0
 */
export type ShowdexSettingsGroup = typeof ShowdexSettingsGroups[number];
