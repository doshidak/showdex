/**
 * Capitalizes the given string, `str`.
 *
 * @since 1.0.3
 */
export const capitalize = (str: string): string => (str?.charAt?.(0).toUpperCase() ?? '') + (str?.slice?.(1) ?? '');
