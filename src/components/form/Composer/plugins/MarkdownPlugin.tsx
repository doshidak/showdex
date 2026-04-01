/**
 * @file `MarkdownPlugin.tsx`
 * @author Keith Choison <keith@tize.io>
 * @since 1.3.0
 */

import * as React from 'react';
import { MarkdownShortcutPlugin as LexicalMarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { $createTextNode } from 'lexical';
import { $createCodeNode } from '@lexical/code';
import { CODE, TRANSFORMERS } from '@lexical/markdown';

// note: $createCodeNode() internally hardcodes its DEFAULT_CODE_LANGUAGE to 'javascript' (in @lexical/code/CodeNode.ts),
// so we're doing all this CODE.replace() reimplementation just to change it to 'plaintext' LOL
const MarkdownTransformers: typeof TRANSFORMERS = [
  {
    ...CODE,
    replace: (
      rootNode,
      children,
      startMatch,
      endMatch,
      linesInBetween,
      isImport,
    ): void => {
      const codeNode = $createCodeNode(startMatch?.[1] || 'plaintext');
      let code: string = '';

      if (linesInBetween?.length) {
        if (linesInBetween.length === 1) { // i.e., single-line code blocks
          code = endMatch
            ? (startMatch?.[1] || '') + linesInBetween[0]
            : linesInBetween[0]?.slice(linesInBetween[0]?.startsWith('\x20') ? 1 : 0);
        } else { // i.e., multi-line code blocks
          if (linesInBetween[0]?.trim()) {
            // first line already has content, so remove the first space char if it exists
            linesInBetween[0] = linesInBetween[0].slice(linesInBetween[0].startsWith('\x20') ? 1 : 0);
          } else {
            // filter out any empty starting lines as to start w/ actual content
            while (linesInBetween.length && !linesInBetween[0]?.length) {
              linesInBetween.shift();
            }
          }

          // filter out any empty ending lines as to end w/ actual content
          while (linesInBetween.length && !linesInBetween[linesInBetween.length - 1]?.length) {
            linesInBetween.pop();
          }

          code = linesInBetween.join('\n');
        }

        codeNode.append($createTextNode(code));
      } else if (children?.length) { // i.e., existing children from paste/import
        codeNode.append(...children);
      } else { // i.e., live typing (just create an empty code block)
        codeNode.append($createTextNode(code));
      }

      rootNode.replace(codeNode);

      if (isImport) {
        return;
      }

      codeNode.select(0, 0);
    },
  },
  ...TRANSFORMERS.filter((t) => t !== CODE),
];

export const MarkdownPlugin = (): React.JSX.Element => (
  <LexicalMarkdownShortcutPlugin transformers={MarkdownTransformers} />
);
