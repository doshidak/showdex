/**
 * Removes crap like wildcard formes from the Pokemon's `speciesForme`.
 *
 * * Also, '*-Gmax' (e.g., 'Grimmsnarl-Gmax') confused the plugin,
 *   so that's removed too LOL.
 *
 * @example 'Urshifu-*' -> 'Urshifu'
 * @since 0.1.0
 */
export const sanitizeSpeciesForme = (
  speciesForme: string,
): string => speciesForme?.replace?.(
  /-(?:\*|Rapid-Strike|Mega|Gmax)/gi,
  '',
);
