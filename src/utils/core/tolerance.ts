/**
 * Checks if the value of `candidate` is within the `deviation` (i.e., plus-minus / ±) of `value`.
 *
 * * `deviation` must be a non-negative number, otherwise, the returned function will always return `false`.
 *   - Note that a `deviation` of `0`, while accepted, is basically a hard-equality check, i.e., `candidate === value`.
 *   - Unless you're dynamically providing the `deviation` value, there's no reason to use this if `deviation`
 *     will always be `0`.
 *
 * @example
 * ```ts
 * // accepted values: 3 to 7, both inclusive
 * const tolerant = tolerance(5, 2);
 *
 * // TypeScript shouldn't let you do this, but just for example's sake:
 * tolerant(); // false
 * tolerant(undefined); // false
 * tolerant(null); // false
 * tolerant(''); // false
 * tolerant(true); // false
 * tolerant({}); // false
 * tolerant([420]); // false
 *
 * // now with values that TypeScript expects:
 * tolerant(NaN); // false
 * tolerant(0); // false
 * tolerant(1); // false
 * tolerant(2); // false
 * tolerant(3); // true
 * tolerant(3.14159); // true
 * tolerant(5); // true
 * tolerant(5.1); // true
 * tolerant(7); // true
 * tolerant(7.1); // false
 * tolerant(69); // false
 * ```
 * @since 1.1.6
 */
export const tolerance = (
  value: number,
  deviation: number,
): ((candidate: number) => boolean) => {
  const validFactoryArgs = [value, deviation].every((t) => typeof t === 'number' && !Number.isNaN(t))
    && deviation >= 0;

  if (!validFactoryArgs) {
    return () => false;
  }

  const minValue = value - deviation;
  const maxValue = value + deviation;

  return (candidate) => typeof candidate === 'number'
    && !Number.isNaN(candidate)
    && candidate >= minValue
    && candidate <= maxValue;
};
