import { nonEmptyObject } from '@showdex/utils/core';
import { hydrateHeader } from './hydrateHeader';

/**
 * Determines if the provided `value` is possibly a dehydrated Showdex payload.
 *
 * * Does **not** determine if the payload itself is valid.
 *
 * @example
 * ```ts
 * possiblyDehydrated('v:1.1.8;@:showdex-v1.1.8-b18BA79B61F2-dev.chrome;...');
 *
 * true
 * ```
 * @example
 * ```ts
 * possiblyDehydrated('foobar');
 *
 * false
 * ```
 * @since 1.1.8
 */
export const possiblyDehydrated = (
  value: string,
  delimiter?: string,
  opcodeDelimiter?: string,
): boolean => {
  if (!value) {
    return false;
  }

  const [header] = hydrateHeader(
    value,
    delimiter,
    opcodeDelimiter,
  );

  return nonEmptyObject(header) && header.descriptorValid;
};
