/**
 * Function arguments of the `diffArrays()` utility.
 *
 * * Primarily used to define the signature of `similarArrays()`, which passes all arguments to this utility.
 *
 * @since 1.1.6
 */
export type ArrayDifferentiatorArgs<T> = [
  arrayA: T[],
  arrayB: T[],
  serialize?: boolean,
];

/**
 * Function signature of the `diffArrays()` utility.
 *
 * * Outside of this utility, don't think it's used anywhere else lmao.
 *   - Not sure why I'm `export`'ing this, but yolo.
 *
 * @since 1.1.6
 */
export type ArrayDifferentiator = <T>(
  ...args: ArrayDifferentiatorArgs<T>
) => T[];

/**
 * Returns the elements that are different in `arrayA` & `arrayB`.
 *
 * * Comparison will be done using the *strict equality comparison operator* (i.e., `===`).
 *   - This means if the elements are objects, then they will only match if they share the same memory address.
 *   - If you'd prefer, you can pass `true` for the optional `serialize` argument, which will serialize the elements
 *     via `JSON.stringify()` & their resulting serialized `strings` compared using the aforementioned operator.
 * * If the return value is empty, then `arrayA` & `arrayB` have the same elements.
 *   - However, note that this does not guarantee they're in the same order!
 * * If the comparison fails for whatever reason, `null` will be returned.
 * * Algorithm effiency: `O(n^2)`, probably
 *
 * @example
 * ```ts
 * diffArrays();
 * -> null
 *
 * diffArrays([]);
 * -> null
 *
 * diffArrays(undefined, []);
 * -> null
 *
 * diffArrays([], []);
 * -> (0) []
 *
 * diffArrays<Showdown.TypeName>(['Ice', 'Dragon'], ['Ice', 'Dragon']);
 * -> (0) []
 *
 * diffArrays<Showdown.TypeName>(['Ice', 'Dragon'], []);
 * -> (2) ['Ice', 'Dragon']
 *
 * diffArrays<Showdown.TypeName>([], ['Ice', 'Dragon']);
 * -> (2) ['Ice', 'Dragon']
 *
 * diffArrays<Showdown.TypeName>(['Ice'], ['Dragon']);
 * -> (2) ['Ice', 'Dragon']
 *
 * diffArrays<Showdown.TypeName>(['Ice', 'Dragon'], ['Dragon']);
 * -> (1) ['Ice']
 *
 * diffArrays<Showdown.TypeName>(
 *   ['Grass', 'Fire'],
 *   ['Water', 'Fire', 'Electric'],
 * );
 * -> (3) ['Grass', 'Water', 'Electric']
 *
 * diffArrays<Partial<CalcdexPokemon>>(
 *   [{ speciesForme: 'Rotom-Wash' }, { speciesForme: 'Landorous-Therian' }],
 *   [{ speciesForme: 'Garchomp' }, { speciesForme: 'Rotom-Wash' }],
 *   true, // serialize via JSON.stringify()
 * );
 * -> (2) [
 *   { speciesForme: 'Landorous-Therian' },
 *   { speciesForme: 'Garchomp' },
 * ]
 * ```
 * @since 1.1.6
 */
export const diffArrays: ArrayDifferentiator = (
  arrayA,
  arrayB,
  serialize,
) => {
  if (!Array.isArray(arrayA) || !Array.isArray(arrayB)) {
    return null;
  }

  // these are to marginally increase performance lol
  if (!arrayA.length && !arrayB.length) {
    return [];
  }

  if (arrayA.length && !arrayB.length) {
    return [...arrayA];
  }

  if (!arrayA.length && arrayB.length) {
    return [...arrayB];
  }

  // surprise type def LOL yolo
  type ElementType = typeof arrayA[0];

  // o shet we gotta actually do the comparison now lmao
  const parse = (value: ElementType) => (
    serialize
      ? JSON.stringify(value)
      : value
  );

  const parsedA = serialize
    ? arrayA.map((v) => parse(v))
    : arrayA;

  const parsedB = serialize
    ? arrayB.map((v) => parse(v))
    : arrayB;

  // note: can be string if `serialize` is true
  const diffIndexFilter = (
    source: (string | ElementType)[],
    target: (string | ElementType)[],
  ) => (
    sourceIndex: number,
  ) => !(
    serialize
      ? target.includes(source[sourceIndex])
      : target.some((v) => v === source[sourceIndex])
  );

  const diffIndicesA = parsedA.map((_, i) => i).filter(diffIndexFilter(parsedA, parsedB));
  const diffIndicesB = parsedB.map((_, i) => i).filter(diffIndexFilter(parsedB, parsedA));

  return [
    ...diffIndicesA.map((i) => arrayA[i]),
    ...diffIndicesB.map((i) => arrayB[i]),
  ];
};
