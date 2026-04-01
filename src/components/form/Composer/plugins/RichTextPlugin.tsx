/**
 * @file `RichTextPlugin.tsx`
 * @author Keith Choison <keith@tize.io>
 * @since 1.3.0
 */

import * as React from 'react';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { ContentEditable as LexicalContentEditable } from '@lexical/react/LexicalContentEditable';
import { RichTextPlugin as LexicalRichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';

export interface RichTextPluginProps extends Pick<React.HTMLAttributes<HTMLDivElement>, 'onFocus' | 'onBlur'> {
  inputClassName?: string;
  inputStyle?: React.CSSProperties;
  hintClassName?: string;
  hintStyle?: React.CSSProperties;
  hint?: React.ReactNode;
}

export const RichTextPlugin = React.forwardRef<HTMLDivElement, RichTextPluginProps>(({
  inputClassName,
  inputStyle,
  hintClassName,
  hintStyle,
  hint,
  onFocus,
  onBlur,
}, forwardedRef): React.JSX.Element => (
  <LexicalRichTextPlugin
    contentEditable={(
      <LexicalContentEditable
        ref={forwardedRef}
        className={inputClassName}
        style={inputStyle}
        {...(!!hint && {
          'aria-placeholder': String(hint),
          placeholder: (
            <div
              className={hintClassName}
              style={hintStyle}
            >
              {hint}
            </div>
          ),
        })}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    )}
    ErrorBoundary={LexicalErrorBoundary}
  />
));

RichTextPlugin.displayName = 'RichTextPlugin';
