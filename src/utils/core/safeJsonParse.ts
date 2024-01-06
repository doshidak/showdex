import { type Json } from '@showdex/consts/core';
import { logger } from '@showdex/utils/debug';

const l = logger('@showdex/utils/core/safeJsonParse()');

/**
 * Only detects if `value` might have a JSON-parsable structure.
 *
 * @author Keith Choison <keith@tize.io>
 * @since 1.0.7
 */
export const isMaybeJson = (value?: unknown): value is string => (
  !!value
    && typeof value === 'string'
    && (
      (value.startsWith('{') && value.trim().endsWith('}'))
        || (value.startsWith('[') && value.trim().endsWith(']'))
    )
);

/**
 * Attempts to safely parse the passed-in `value` as a JSON array or object.
 *
 * * Returns `null` if parsing fails for any reason, including parsing to a primative.
 *   - Only parses objects and arrays!
 *
 * @author Keith Choison <keith@tize.io>
 * @since 1.0.7
 */
export const safeJsonParse = <T = Json>(value?: unknown): T => {
  if (!isMaybeJson(value)) {
    return null;
  }

  try {
    const result = JSON.parse(value) as T;

    if (!Array.isArray(result) && typeof result !== 'object') {
      if (__DEV__) {
        l.warn(
          'Parsing value did not result in an array or object.',
          '\n', 'value', value,
          '\n', 'result', result,
          '\n', '(You will only see this warning on development.)',
        );
      }

      return null;
    }

    return result;
  } catch (error) {
    if (__DEV__) {
      l.warn(
        'Failed to safely parse value as JSON:', error,
        '\n', 'value', value,
        '\n', '(You will only see this warning on development.)',
      );
    }

    return null;
  }
};
