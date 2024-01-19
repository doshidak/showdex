/**
 * Construct a type with the properties of `T` replaced with those of `R`.
 *
 * @example
 * ```ts
 * type ItemId = { id: string; getId: () => string; hasId: () => boolean; };
 * type ItemNumId = Modify<ItemId, { id: number; getId: () => number; }>;
 * // -> { id: number; getId: () => number; hasId: () => boolean; }
 * type ItemTId<T> = Modify<ItemId, { id: T; getId: () => T; }>;
 * ```
 * @since 0.1.0
 */
declare type Modify<T, R> = Omit<T, keyof R> & R;

/**
 * Construct a type with all properties of `T`, including any sub-properties, as partials.
 *
 * @example
 * ```ts
 * type Sosig = {
 *   saturation: {
 *     fatness: number;
 *     color: number;
 *   };
 *   gain: number;
 * };
 * type SosigPartial = Partial<Sosig>;
 * // -> { saturation?: { fatness: number; color: number; }; gain?: number; }
 * type SosigDeepPartial = DeepPartial<Sosig>;
 * // -> { saturation?: { fatness?: number; color?: number; }; gain?: number; }
 * ```
 * @since 0.1.0
 */
declare type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: T[P] extends string | number | boolean | symbol | unknown[] ? T[P] : DeepPartial<T[P]>;
} : T;

/**
 * Construct a type from `T` whose properties in `K` are required.
 *
 * @example
 * ```ts
 * type Sosig = {
 *   fatness?: number;
 *   color: number;
 *   gain?: number;
 * };
 * type AddMoreSosig = PickRequired<Sosig, 'fatness'>;
 * // -> { fatness: number; color: number; gain?: number; }
 * ```
 * @since 1.0.2
 */
declare type PickRequired<T, K extends keyof T> = Modify<T, Required<Pick<T, K>>>;

/**
 * Construct a type from `T` whose properties in `K` are optional.
 *
 * @example
 * ```ts
 * type Sosig = {
 *   fatness: number;
 *   color: number;
 *   gain?: number;
 * };
 * type MaybeFatSosig = PickOptional<Sosig, 'fatness'>;
 * // -> { fatness?: number; color: number; gain?: number; }
 * ```
 * @since 1.2.3
 */
declare type PickOptional<T, K extends keyof T> = Modify<T, Partial<Pick<T, K>>>;

/**
 * Construct a literal type with the keys of the indexable type `T` whose types extend the literal type `K`.
 *
 * @example
 * ```ts
 * type Sosig = {
 *   fatness: number;
 *   color: number;
 *   gain: number;
 *   reset: () => void;
 * };
 * type SosigParams = ExtractKeys<Sosig, number>;
 * // -> 'fatness' | 'color' | 'gain'
 * ```
 * @since 0.1.0
 */
declare type ExtractKeys<T, K> = { [I in keyof T]: T[I] extends K ? I : never; }[keyof T];

/**
 * Construct an array of literal tuples containing the keys of the indexable type `T` and the type of the corresponding value.
 *
 * * Most useful for declaring the `[key, value]` types in `Object.entries()`.
 *
 * @example
 * ```ts
 * const sosig: Sosig = {
 *   fatness: 100,
 *   color: 100,
 *   gain: 6,
 *   reset: () => {},
 * };
 * type SosigEntries = Extract<typeof sosig>;
 * // -> (['fatness', number] | ['color', number] | ['gain', number], ['reset', () => void])[]
 * ```
 * @since 0.1.0
 */
declare type Entries<T> = { [K in keyof T]: [K, T[K]] }[keyof T][];

/**
 * Construct a literal type of the property keys of `T` whose types are those of `Function`.
 *
 * * Primarily used as a helper type for the type `FunctionProperties<T>`.
 *
 * @since 0.1.0
 */
declare type FunctionPropertyNames<T> = ExtractKeys<T, (...args: unknown[]) => unknown>;

/**
 * Construct a type with the properties of `T` whose types are those of `Function`.
 *
 * * Useful if you want to extend just the functions of a class or interface.
 *
 * @since 0.1.0
 */
declare type FunctionProperties<T> = Pick<T, FunctionPropertyNames<T>>;

/**
 * Construct a literal type of the property keys of `T` whose types are **not** those of `Function`.
 *
 * * Primarily used as a helper type for the type `NonFunctionProperties<T>`.
 *
 * @since 0.1.0
 */
declare type NonFunctionPropertyNames<T> = Exclude<keyof T, FunctionPropertyNames<T>>;

/**
 * Construct a type with the properties of `T` whose types **not** are those of `Function`.
 *
 * * Useful if you want to extend non-function properties of a class or interface.
 * * Also useful for defining a *lean* type for a class or interface.
 *
 * @since 0.1.0
 */
declare type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

/**
 * Construct a type with all `readonly` properties removed.
 *
 * @since 1.0.2
 */
declare type Writable<T> = { -readonly [P in keyof T]: T[P]; };

/**
 * Construct a type with all `readonly` properties, including those in any sub-properties, removed.
 *
 * @since 1.0.2
 */
declare type DeepWritable<T> = { -readonly [P in keyof T]: DeepWritable<T[P]>; };
