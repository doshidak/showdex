/**
 * @file `ReadOnlyPlugin.tsx`
 * @author Keith Choison <keith@tize.io>
 * @since 1.3.0
 */

import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

export interface ReadOnlyPluginProps {
  readOnly?: boolean;
}

export const ReadOnlyPlugin = ({
  readOnly,
}: ReadOnlyPluginProps): React.JSX.Element => {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    if (editor.isEditable() === !readOnly) {
      return;
    }

    editor.setEditable(!readOnly);
  }, [
    editor,
    readOnly,
  ]);

  return null;
};
