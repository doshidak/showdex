import { PokemonStatNames } from '@showdex/consts';
import { logger } from '@showdex/utils/debug';
import type { Result } from '@smogon/calc';

/**
 * Parsed matchup description from the calculated `result.desc()`.
 *
 * * Description string is separated for use within the damage range tooltip in `PokeMoves`.
 *   - Each part can be rendered on their own lines to increase readability.
 *   - A bit difficult to quickly scan if the description is rendered in a single line.
 * * Only meant to be used visually; the original description string should still be copied to the user's clipboard.
 *
 * @since 1.0.2
 */
export interface CalcdexMatchupParsedDescription {
  /**
   * Original, unparsed description directly returned from `result.desc()`.
   *
   * @example '252 Atk Weavile Knock Off (97.5 BP) vs. 252 HP / 0 Def Heatran: 144-169 (37.3 - 43.7%) -- guaranteed 2HKO after Stealth Rock and 2 layers of Spikes'
   * @since 1.0.2
   */
  raw?: string;

  /**
   * Description line referring to the attacking Pokemon.
   *
   * @example '252 ATK Weavile Knock Off (97.5 BP)'
   * @since 1.0.2
   */
  attacker?: string;

  /**
   * Description line referring to the defending Pokemon.
   *
   * @example '252 HP / 0 DEF Heatran'
   * @since 1.0.2
   */
  defender?: string;

  /**
   * Description line referring to the damage range.
   *
   * @example '144-169 (37.3 - 43.7%)'
   * @since 1.0.2
   */
  damageRange?: string;

  /**
   * Description line referring to KO chance, along with any secondary effects like stage hazards, if applicable.
   *
   * @example 'guaranteed 2HKO after Stealth Rock and 2 layers of Spikes'
   * @since 1.0.2
   */
  koChance?: string;
}

const l = logger('@showdex/utils/calc/parseDescription');

/**
 * Formats the description string from `result.desc()` into separate parts.
 *
 * * Resulting parsed description is meant to be used visually, such as rendering the string in a tooltip,
 *   like in the damage range tooltip in `PokeMoves`.
 *
 * @example
 * ```ts
 * > parseDescription(result);
 * {
 *   raw: '252 Atk Weavile Knock Off (97.5 BP) vs. 252 HP / 0 Def Heatran: 144-169 (37.3 - 43.7%) -- guaranteed 2HKO after Stealth Rock and 2 layers of Spikes',
 *   attacker: '252 ATK Weavile Knock Off (97.5 BP)',
 *   defender: '252 HP / 0 DEF Heatran',
 *   damageRange: '144-169 (37.3 - 43.7%)',
 *   koChance: 'guaranteed 2HKO after Stealth Rock & 2 layers of Spikes',
 * }
 * ```
 * @since 1.0.2
 */
export const parseDescription = (result: Result): CalcdexMatchupParsedDescription => {
  const output: CalcdexMatchupParsedDescription = {
    raw: null,
    attacker: null,
    defender: null,
    damageRange: null,
    koChance: null,
  };

  if (typeof result?.desc !== 'function') {
    return output;
  }

  try {
    output.raw = result.desc();
  } catch (error) {
    if (__DEV__ && !(<Error> error)?.message?.includes('=== 0')) {
      l.warn(
        'Failed to obtain result description via result.desc()', error,
        '\n', 'result', result,
        '\n', '(You will only see this warning on development.)',
      );
    }

    throw error;
  }

  if (!output.raw) {
    return output;
  }

  let formatted = output.raw;

  // e.g., '0 Def / 0 SpA' -> '0 DEF / 0 SPA'
  for (const stat of PokemonStatNames) {
    formatted = formatted.replace(
      new RegExp(`(\\d+[-+]?)\\s+${stat}`, 'gi'), // e.g., '128+ Atk'
      `$1 ${stat.toUpperCase()}`,
    );
  }

  // e.g., 'Lvl 84' -> 'L84'
  formatted = formatted.replace(/Lvl\s+(\d+)/gi, 'L$1');

  output.attacker = formatted.slice(0, formatted.indexOf(' vs.')) || null;
  output.defender = formatted.slice(formatted.indexOf('vs. ') + 4, formatted.indexOf(': ')) || null;

  output.damageRange = formatted.slice(
    formatted.indexOf(': ') + 2,
    formatted.includes('--') ? formatted.indexOf(' --') : undefined,
  ) || null;

  output.koChance = formatted.includes('--')
    ? formatted.slice(formatted.indexOf('-- ') + 3) || null
    : null;

  return output;
};
