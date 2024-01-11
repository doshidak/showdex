import { formatId, nonEmptyObject } from '@showdex/utils/core';
import { type DropdownOption } from './Dropdown';

/* eslint-disable @typescript-eslint/indent */

// it's the same filter, but we just slapped a 2 on it
const f2 = <TOption extends DropdownOption>(
  o: TOption,
  v: string,
): boolean => formatId(
  `${String(o?.label || '')}${o?.value || ''}`,
).includes(formatId(v));

/**
 * `react-select` user-input search filter with support for an optional `alias` dictionary.
 *
 * * Dictionaries are typically accessed via the `i18n.t()` function (e.g., `useTranslation()` from `react-i18n`).
 * * When the `input` partially matches an alias from the start, the search string will expand to the corresponding
 *   value stored in the provided `alias` dictionary.
 * * Otherwise, it's pretty much a reimplementation of the `createFilter()` function used by `react-select`.
 *   - While the library does export the aforementioned function, `formatId()` uses the native `normalize()` to strip
 *     diacritics, which might be faster tbh idk.
 *   - Never had a problem with the default one tho, works great.
 *   - inb4 I take a fat L
 *
 * @since 1.2.1
 */
export const createAliasFilter = (
  alias?: Record<string, string>,
): <
  TOption extends DropdownOption,
>(
  option: TOption,
  value: string,
) => boolean => {
  if (!nonEmptyObject(alias)) {
    return (o, v) => f2(o, v);
  }

  return (
    option,
    value,
  ) => {
    const input = formatId(value);
    const matches = Object.entries(alias).filter(([k]) => formatId(k).startsWith(input));

    return (!!matches?.length && matches.some(([, v]) => f2(option, v)))
      || f2(option, input);
  };
};

/* eslint-enable @typescript-eslint/indent */
