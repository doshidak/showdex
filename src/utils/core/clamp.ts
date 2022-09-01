/**
 * Clamps a `value` between `min` and `max`, both inclusive.
 *
 * @since 0.1.3
 */
export const clamp = (
  min: number,
  value: number,
  max?: number,
): number => Math.max(Math.min(value, max ?? value), min);
