import * as React from 'react';
import {
  NIL,
  v1 as uuidv1,
  v4 as uuidv4,
  v5 as uuidv5,
} from 'uuid';
import { env } from '@showdex/utils/core';

const uuidNamespace = env('uuid-namespace', NIL);

/**
 * Generates a pretty-much-guaranteed-to-be-unique UUID & stored in a `React.MutableRefObject<string>`
 * to persist between renders.
 *
 * * Primarily used in components as a fallback value for `id`'s & `key`'s.
 * * This is to avoid DOM errors from duplicate `id` attributes.
 *   - Thanks Mina -.-
 *
 * @since 1.1.6
 */
export const useRandomUuid = (): string => {
  // note: uuidv1() is timestamp-based & uuidv4() is random
  // (& if you couldn't tell, uuidv5() is namespace-based)
  const uuidRef = React.useRef<string>(uuidv5(
    `${uuidv1()}-${uuidv4()}`,
    uuidNamespace,
  ));

  return uuidRef.current;
};
