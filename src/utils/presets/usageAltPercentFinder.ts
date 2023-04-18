import { formatId } from '@showdex/utils/app';
import { percentage } from '@showdex/utils/humanize';
import type { CalcdexPokemonAlt } from '@showdex/redux/store';
import { detectUsageAlt } from './detectUsageAlt';

/* eslint-disable @typescript-eslint/indent */

/**
 * Factory that creates a function for finding the usage percent of the passed-in `name`.
 *
 * * `null` is returned when no usage percentage could be found, either due to the `alts` provided
 *   to the factory (e.g., empty or contains no `CalcdexPokemonUsageAlt<T>`s), or a falsy/mismatching `name`.
 * * If `humanize` is `true`, the resulting value will be formatted as a percentage with a precision
 *   of 2 decimal places (e.g., `'69.69%'`).
 *   - Note that even if `humanize` is `false` (default), the `number` will be converted to a `string`.
 *   - Why? It's a bitch to provide a dynamic return type depending on the value of `humanize`.
 *   - Sorry :o
 *
 * @since 1.0.3
 */
export const usageAltPercentFinder = <
  T extends string,
>(
  alts: CalcdexPokemonAlt<T>[],
  humanize?: boolean,
): (name: T) => string => {
  const usageAlts = alts?.filter?.(detectUsageAlt);

  if (!usageAlts?.length) {
    return () => null;
  }

  return (name) => {
    const nameId = formatId(name);
    const [, usage] = nameId
      ? usageAlts.find((a) => formatId(a?.[0]) === nameId) || []
      : [];

    if (!usage) {
      return null;
    }

    return String(humanize ? percentage(usage, 2) : usage);
  };
};

/* eslint-enable @typescript-eslint/indent */
