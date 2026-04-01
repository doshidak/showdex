/**
 * @file `AutoLinkPlugin.tsx`
 * @author Keith Choison <keith@tize.io>
 * @since 1.3.0
 */

import * as React from 'react';
import { type LinkMatcher, AutoLinkPlugin as LexicalAutoLinkPlugin } from '@lexical/react/LexicalAutoLinkPlugin';
import { execEmail, execUrl } from '@showdex/utils/validate';

const matchers: LinkMatcher[] = [
  (text) => {
    const match = execUrl(text);

    if (!match?.[0]) {
      return null;
    }

    return {
      index: match.index,
      length: match[0].length,
      text: match[0],
      url: match[0],
    };
  },

  (text) => {
    const match = execEmail(text);

    if (!match?.[0]) {
      return null;
    }

    return {
      index: match.index,
      length: match[0].length,
      text: match[0],
      url: `mailto:${match[0]}`,
    };
  },
];

export const AutoLinkPlugin = (): React.JSX.Element => (
  <LexicalAutoLinkPlugin matchers={matchers} />
);
