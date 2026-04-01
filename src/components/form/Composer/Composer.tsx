/**
 * @file `Composer.tsx`
 * @author Keith Choison <keith@tize.io>
 * @since 1.3.0
 */

import * as React from 'react';
import { type FieldRenderProps } from 'react-final-form';
import { type InitialConfigType, type InitialEditorStateType, LexicalComposer } from '@lexical/react/LexicalComposer';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
// import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
// import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { type EditorState } from 'lexical';
import cx from 'classnames';
import { logger } from '@showdex/utils/debug';
import { ComposerTheme } from './ComposerTheme';
import {
  type RichTextPluginProps,
  AutoLinkPlugin,
  CodePlugin,
  ListIndentPlugin,
  MarkdownPlugin,
  ReadOnlyPlugin,
  RichTextPlugin,
} from './plugins';
import styles from './Composer.module.scss';

export interface ComposerProps extends RichTextPluginProps, FieldRenderProps<string, HTMLDivElement> {
  className?: string;
  style?: React.CSSProperties;
  editorClassName?: string;
  editorStyle?: React.CSSProperties;
  namespace?: string;
  initialEditorState?: InitialEditorStateType;
  readOnly?: boolean;
  disabled?: boolean;
}

const l = logger('@showdex/components/form/Composer');

/**
 * Markdown-based WYSIWYG (i.e., What You See Is What You Get) text editor.
 *
 * * Handles similar to Notion's WYSIWYG editor.
 * * Imported from our long dead `@tizeio/web` project.
 *
 * @since 1.3.0
 */
export const Composer = React.forwardRef<HTMLDivElement, ComposerProps>(({
  className,
  style,
  editorClassName,
  editorStyle,
  inputClassName,
  hintClassName,
  namespace,
  initialEditorState,
  input,
  readOnly,
  disabled,
  ...props
}, forwardedRef): React.JSX.Element => {
  const initialConfig = React.useMemo<InitialConfigType>(() => ({
    namespace: input?.name || namespace,
    theme: ComposerTheme,
    editorState: initialEditorState,
    editable: !readOnly && !disabled,

    nodes: [
      AutoLinkNode,
      CodeHighlightNode,
      CodeNode,
      HeadingNode,
      LinkNode,
      ListItemNode,
      ListNode,
      QuoteNode,
      // TableCellNode,
      // TableNode,
      // TableRowNode,
    ],

    onError: (error) => {
      if (__DEV__) {
        l.error(error);
      }

      throw error;
    },
  }), []); // eslint-disable-line react-hooks/exhaustive-deps -- only read once during initialization

  const handleChange = React.useCallback((
    editorState: EditorState,
  ): void => void input?.onChange(
    typeof editorState === 'string'
      ? editorState
      : JSON.stringify(editorState), // note: JSON.stringify() internally invokes editorState.toJSON()
  ), [
    input,
  ]);

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div
        className={cx(styles.container, className)}
        style={style}
        data-showdex-form="composer"
        data-showdex-disabled={disabled}
      >
        <div
          className={cx(styles.editor, editorClassName)}
          style={editorStyle}
        >
          {/* primary text editor */}
          <RichTextPlugin
            ref={forwardedRef}
            {...props}
            inputClassName={cx(styles.input, inputClassName)}
            hintClassName={cx(styles.hint, hintClassName)}
          />

          <HistoryPlugin />
          <LinkPlugin />
          <ListPlugin />
          {/* <TablePlugin /> */}

          <AutoLinkPlugin />
          <CodePlugin />
          <ListIndentPlugin />
          <MarkdownPlugin />

          <TabIndentationPlugin />
          <ReadOnlyPlugin readOnly={readOnly} />
          <OnChangePlugin ignoreSelectionChange onChange={handleChange} />
        </div>
      </div>
    </LexicalComposer>
  );
});
