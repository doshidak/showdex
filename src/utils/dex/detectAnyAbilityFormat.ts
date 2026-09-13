import { type GenerationNum } from '@smogon/calc';
import { formatId } from '@showdex/utils/core';

/**
 * Format ID fragments of formats where a Pokemon's ability isn't restricted to its species' usual pool.
 *
 * * Covers every *Hackmons* variant (Balanced, Pure, Hackmons Cup, etc.), every *Almost Any Ability* variant
 *   (incl. the `aaa`-suffixed ones like Tier Shift AAA & National Dex AAA) & *Inheritance*.
 *   - (List derived from `config/formats.ts` in the PS server as of 2026/09/12.)
 *
 * @since 1.4.2
 */
const AnyAbilityFormatPattern = /hackmons|almostanyability|aaa|inheritance/;

/**
 * Whether the provided `format` lets a Pokemon run an ability outside of its species' usual pool.
 *
 * * In these formats, any ability the user picks is legal, so it shouldn't get "corrected" back to the species'
 *   default ability, e.g., when `sanitizePokemon()` runs during a battle sync.
 *
 * @example
 * ```ts
 * detectAnyAbilityFormat('gen9balancedhackmons'); // true
 * detectAnyAbilityFormat('gen9nationaldexaaa'); // true
 * detectAnyAbilityFormat('gen9ou'); // false
 * ```
 * @since 1.4.2
 */
export const detectAnyAbilityFormat = (
  format: string | GenerationNum,
): boolean => typeof format === 'string' && AnyAbilityFormatPattern.test(formatId(format));
