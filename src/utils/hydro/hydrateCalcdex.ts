import { type CalcdexPlayerSide } from '@showdex/redux/store';
import { hydrateValue } from './hydratePrimitives';

/**
 * Hydrates a string `value` into a `CalcdexPlayerSide`.
 *
 * @since 1.0.3
 */
export const hydrateFieldSide = (
  value: string,
  delimiter = '/',
): CalcdexPlayerSide => {
  const entries = value
    ?.split(delimiter)
    .map((v) => v?.split('=') as [keyof CalcdexPlayerSide, string])
    .filter(Boolean)
    || [];

  return entries.reduce((prev, [key, entryValue]) => {
    prev[key] = hydrateValue(entryValue);

    return prev;
  }, {} as CalcdexPlayerSide);
};
