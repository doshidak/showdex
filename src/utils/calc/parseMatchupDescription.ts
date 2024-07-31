import { type Result } from '@smogon/calc';
import { PokemonStatNames } from '@showdex/consts/dex';
import { logger } from '@showdex/utils/debug';

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
   * @example
   * ```ts
   * '252 Atk Weavile Knock Off (97.5 BP) vs. 252 HP / 0 Def Heatran: 144-169 (37.3 - 43.7%) -- guaranteed 2HKO after Stealth Rock and 2 layers of Spikes'
   * ```
   * @since 1.0.2
   */
  raw?: string;

  /**
   * Description line referring to the attacking Pokemon.
   *
   * @example
   * ```ts
   * '252 ATK Weavile Knock Off (97.5 BP)'
   * ```
   * @default null
   * @since 1.0.2
   */
  attacker?: string;

  /**
   * Description line referring to the defending Pokemon.
   *
   * @example
   * ```ts
   * '252 HP / 0 DEF Heatran'
   * ```
   * @default null
   * @since 1.0.2
   */
  defender?: string;

  /**
   * Description line referring to the damage range.
   *
   * @example
   * ```ts
   * '144-169 (37.3 - 43.7%)'
   * ```
   * @default null
   * @since 1.0.2
   */
  damageRange?: string;

  /**
   * Possible damage amounts, already joined with commas (`,`).
   *
   * @example
   * ```ts
   * '144, 145, 147, 148, 150, 151, 153, 154, 157, 159, 160, 162, 163, 165, 166, 169'
   * ```
   * @default null
   * @since 1.0.3
   */
  damageAmounts?: string;

  /**
   * Recoil description directly returned from `result.recoil('%').text`.
   *
   * @example
   * ```ts
   * '50% recoil damage'
   * ```
   * @since 1.2.4
   */
  recoil?: string;

  /**
   * Recovery description directly returned from `result.recovery('%').text`.
   *
   * @example
   * ```ts
   * '8.7 - 10.2% recovered'
   * ```
   * @since 1.2.4
   */
  recovery?: string;

  /**
   * Description line referring to KO chance, along with any secondary effects like stage hazards, if applicable.
   *
   * @example
   * ```ts
   * 'guaranteed 2HKO after Stealth Rock & 2 layers of Spikes'
   * ```
   * @default null
   * @since 1.0.2
   */
  koChance?: string;

  /**
   * Translation lookup key for a reason explaining why using the move will fail, if applicable.
   *
   * * Typically used for gen 1, where there exists a plethora of battle glitches.
   *   - Not all of them are currently implemented, but new ones should update this value.
   * * These aren't provided by `@smogon/calc`, but currently being populated in the `parseMatchupDescription()` utility.
   * * Key should be prefixed with `'calcdex:poke.moves.failureReasons.'` when performing an i18next `t()` lookup.
   *
   * @example
   * ```ts
   * 'rbyRecovery'
   *
   * // t('calcdex:poke.moves.failureReasons.rbyRecovery')
   * // -> (en) 'Due to a glitch in gen 1, recovery moves will fail if the remainder of dividing the HP lost by 256 is 255.'
   * ```
   * @default null
   * @since 1.2.4
   */
  failureKey?: string;
}

const trimSecondaryRange = (
  desc: string,
): string => {
  if (!desc?.includes(' - ') || !desc.includes('% ')) {
    return desc;
  }

  const [min, max] = desc.slice(0, desc.indexOf('% ')).split(' - ').map(parseFloat);

  if (min !== max) {
    return desc;
  }

  return desc.slice(desc.indexOf(' - ') + 3);
};

const l = logger('@showdex/utils/calc/parseMatchupDescription()');

/**
 * Formats the description string from `result.desc()` into separate parts.
 *
 * * Resulting parsed description is meant to be used visually, such as rendering the string in a tooltip,
 *   like in the damage range tooltip in `PokeMoves`.
 *
 * @example
 * ```ts
 * const result = calculate(...);
 * parseMatchupDescription(result);
 *
 * {
 *   raw: '252 Atk Weavile Knock Off (97.5 BP) vs. 252 HP / 0 Def Heatran: 144-169 (37.3 - 43.7%) -- guaranteed 2HKO after Stealth Rock and 2 layers of Spikes',
 *   attacker: '252 ATK Weavile Knock Off (97.5 BP)',
 *   defender: '252 HP / 0 DEF Heatran',
 *   damageRange: '144-169 (37.3 - 43.7%)',
 *   damageAmounts: '144, 145, 147, 148, 150, 151, 153, 154, 157, 159, 160, 162, 163, 165, 166, 169',
 *   recoil: null,
 *   recovery: null,
 *   koChance: 'guaranteed 2HKO after Stealth Rock & 2 layers of Spikes',
 *   failureKey: null,
 * } as CalcdexMatchupParsedDescription
 * ```
 * @since 1.0.2
 */
export const parseMatchupDescription = (
  result: Result,
): CalcdexMatchupParsedDescription => {
  const output: CalcdexMatchupParsedDescription = {
    raw: null,
    attacker: null,
    defender: null,
    damageRange: null,
    damageAmounts: null,
    recoil: null,
    recovery: null,
    koChance: null,
    failureKey: null,
  };

  if (typeof result?.desc !== 'function') {
    return output;
  }

  try {
    output.raw = result.desc();
    output.recoil = result.recoil('%').text || null;
    output.recovery = result.recovery('%').text || null;
  } catch (error) {
    if (__DEV__ && !(error as Error)?.message?.includes('=== 0')) {
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

  // e.g., '50.1 - 50.1% recoil damage' -> '50.1% recoil damage'
  if (output.recoil) {
    output.recoil = trimSecondaryRange(output.recoil);
  }

  if (output.recovery) {
    output.recovery = trimSecondaryRange(output.recovery);
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

  output.damageAmounts = (
    Array.isArray(result.damage)
      ? result.damage.flatMap<number>((d: number | number[]) => d).join(', ')
      : String(result.damage)
  ) || null;

  output.koChance = formatted.includes('--')
    ? formatted.slice(formatted.indexOf('-- ') + 3) || null
    : null;

  if (output.koChance) {
    output.koChance = output.koChance.replace(/(?<=\s+)and(?=\s+)/, '&');
  }

  // update (2024/07/21): patron priority request
  // see: https://bulbapedia.bulbagarden.net/wiki/List_of_battle_glitches_in_Generation_I#HP_recovery_move_failure
  const recoveryFailure = result.gen.num === 1
    && result.move.named('Recover', 'Rest', 'Soft-Boiled')
    && !((result.attacker.maxHP() - result.attacker.curHP() + 1) % 256);

  if (recoveryFailure) {
    output.failureKey = 'rbyRecovery';
  }

  return output;
};
