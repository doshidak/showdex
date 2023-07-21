/**
 * Determines if the provided `obj` is a non-empty object or array.
 *
 * * You can safely pass any type for `obj`, which will fallback to an empty object (i.e., `{}`) if falsy.
 *   - However, primitives (determined by `typeof obj`) will always return `false`.
 *   - For instance, if you pass in `true` (of type `boolean`) for `obj`, `false` will be returned.
 *   - Technically, this only handles `null` values since `typeof null` is `'object'`, hence the fallback.
 * * Since arrays are technically objects, this will also properly handle arrays passed in for `obj`.
 *
 * @example
 * ```ts
 * nonEmptyObject({}); // false
 * nonEmptyObject({ foo: true }); // true
 * nonEmptyObject([]); // false
 * nonEmptyObject([1, 2, 3]); // true
 * nonEmptyObject([{ foo: true }]); // true
 * nonEmptyObject(); // false
 * nonEmptyObject(null); // false
 * nonEmptyObject(420); // false
 * nonEmptyObject('empty'); // false
 * ```
 * @since 1.1.6
 */
export const nonEmptyObject = (
  obj?: unknown,
): boolean => {
  if (typeof obj !== 'object') {
    return false;
  }

  // at this point, can be one of the following:
  // null (typeof is 'object'), object, array
  if (Array.isArray(obj)) {
    return !!obj.length;
  }

  return !!Object.keys(obj || {}).length;
};
