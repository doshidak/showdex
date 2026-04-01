/**
 * @file `ListIndentPlugin.tsx`
 * @author Keith Choison <keith@tize.io>
 * @since 1.3.0
 */

import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getListDepth, $isListItemNode, $isListNode } from '@lexical/list';
import {
  type ElementNode,
  type RangeSelection,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  INDENT_CONTENT_COMMAND,
} from 'lexical';

export interface ListIndentPluginProps {
  /**
   * Max indentation length.
   *
   * @default 7
   * @since 1.3.0
   */
  maxDepth?: number;
}

const getSelectionElementNodes = (
  selection: RangeSelection,
): Set<ElementNode> => {
  if (!$isRangeSelection(selection)) {
    return null;
  }

  const selectionNodes = selection.getNodes();

  if (!selectionNodes?.length) {
    return new Set<ElementNode>([
      selection.anchor.getNode().getParentOrThrow(),
      selection.focus.getNode().getParentOrThrow(),
    ]);
  }

  const elementNodes = selectionNodes
    .map((n) => ($isElementNode(n) ? n : n?.getParentOrThrow?.()))
    .filter(Boolean);

  return new Set<ElementNode>(elementNodes);
};

const indentAllowed = (
  maxDepth,
): boolean => {
  if ((maxDepth ?? -1) < 0) {
    return false;
  }

  const selection = $getSelection();

  if (!$isRangeSelection(selection)) {
    return false;
  }

  // fyi, elementNodes is a Set<ElementNode>, not an Array<ElementNode>!
  const elementNodes = getSelectionElementNodes(selection);

  if (!elementNodes?.size) {
    return false;
  }

  let totalDepth = 0;

  elementNodes.forEach((elementNode) => {
    if ($isListNode(elementNode)) {
      totalDepth = Math.max(
        $getListDepth(elementNode) + 1,
        totalDepth,
      );

      return;
    }

    if (!$isListItemNode(elementNode)) {
      return;
    }

    const parentNode = elementNode.getParent();

    if (!$isListNode(parentNode)) {
      throw new Error('ListItemNode must have a parent ListNode... wait, a wat now?');
    }

    totalDepth = Math.max(
      $getListDepth(parentNode) + 1,
      totalDepth,
    );
  });

  return totalDepth <= maxDepth;
};

export const ListIndentPlugin = ({
  maxDepth = 7,
}: ListIndentPluginProps): React.JSX.Element => {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => void editor.registerCommand(
    INDENT_CONTENT_COMMAND,
    () => !indentAllowed(maxDepth),
    COMMAND_PRIORITY_HIGH,
  ), [
    editor,
    maxDepth,
  ]);

  return null;
};
