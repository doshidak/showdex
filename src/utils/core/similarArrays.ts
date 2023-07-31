import { type ArrayDifferentiatorArgs, diffArrays } from './diffArrays';

/**
 * Whether `arrayA` & `arrayB` contain the same elements, but not necessarily in the same order.
 *
 * * Determined by the number of elements in the returned index of `diffArrays()`.
 *   - Note that if `null` is received, i.e., the comparison fails, `false` will be returned.
 * * All arguments of this utility will be directly passed to `diffArrays()`.
 *   - There's an `ArrayDifferentiatorArgs<T>` type that can be inconveniently accessed inside
 *     the implementation of the aforementioned function c:
 *   - Why? Just in case I decide to change the args & I totally remember to update this /s
 *
 * @example
 * ```ts
 * similarArrays(undefined, []);
 * -> false
 *
 * similarArrays<Showdown.TypeName>(
 *   ['Ice', 'Dragon'],
 *   ['Water', 'Electric'],
 * );
 * -> false
 *
 * similarArrays<Showdown.TypeName>(
 *   ['Ice', 'Dragon'],
 *   ['Dragon', 'Ice'],
 * );
 * -> true
 * ```
 * @see `diffArrays()` from `@showdex/utils/core`
 * @since 1.1.6
 */
export const similarArrays = <T>(
  ...args: ArrayDifferentiatorArgs<T>
): boolean => {
  // since arrayA & arrayB are required lmao
  if (args.length < 2) {
    return false;
  }

  const diff = diffArrays(...args);

  // note: diffArrays() can return null if the comparison fails!
  // we should return false instead of true (see the final return below)
  if (!Array.isArray(diff)) {
    return false;
  }

  // now we can safely go based off of the returned diff length c:
  // (diff.length of 0 = no difference = arrays are similar! duh)
  return !diff.length;
};
