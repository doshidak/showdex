/**
 * @file `CodePlugin.tsx`
 * @author Keith Choison <keith@tize.io>
 * @since 1.3.0
 */

import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { registerCodeHighlighting } from '@lexical/code';
// import 'prismjs/components/prism-bash'; // warning: importing these may make the transpiled main.js too thicc
// import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-python';
// import 'prismjs/components/prism-scss';
// import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';
// import 'prismjs/components/prism-xml-doc';
import 'prismjs/components/prism-yaml';

export const CodePlugin = (): React.JSX.Element => {
  const [editor] = useLexicalComposerContext();

  React.useEffect(
    () => void registerCodeHighlighting(editor),
    [editor],
  );

  return null;
};
