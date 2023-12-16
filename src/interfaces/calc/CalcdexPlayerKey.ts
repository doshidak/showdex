/**
 * All player keys available in the `battle` object.
 *
 * @since 1.1.3
 */
export const CalcdexPlayerKeys = [
  'p1',
  'p2',
  'p3',
  'p4',
] as const;

/**
 * Key of a given player.
 *
 * @since 0.1.0
 */
export type CalcdexPlayerKey = typeof CalcdexPlayerKeys[number];
