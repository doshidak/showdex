/**
 * Additional metadata passed to RTK Query transformers from their corresponding query functions.
 *
 * @since 1.2.3
 */
export interface PkmnApiSmogonQueryMeta {
  /**
   * Response headers, if any.
   *
   * * Object is constructed from the `response.headers` iterator in `runtimeFetch()` from `@showdex/utils/core`.
   * * All header keys will be lowercased to ensure consistency across build targets (e.g., `'accept-range'`).
   * * Any falsy header values will be omitted from this object.
   *
   * @example
   * ```ts
   * {
   *   'accept-range': 'bytes',
   *   'access-control-allow-origin': '*',
   *   // ... //
   * }
   * ```
   * @since 1.2.3
   */
  resHeaders?: Record<string, string>;
}
