import * as React from 'react';
import {
  type CollisionDetection,
  type DragCancelEvent,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';

/**
 * Wasn't exported from `@dnd-kit/core`, so using some TS trickery to make it work.
 *
 * @since 1.2.3
 */
export type DragEvent = DragMoveEvent & DragStartEvent;

export interface DndMuxEventHandlers {
  onDragStart?: (event?: DragStartEvent) => void;
  onDragMove?: (event?: DragMoveEvent) => void;
  onDragOver?: (event?: DragOverEvent) => void;
  onDragEnd?: (event?: DragEndEvent) => void;
  onDragCancel?: (event?: DragCancelEvent) => void;
}

export interface DndMuxInput {
  /**
   * Unique ID for the event handlers.
   *
   * * No specific format is enforced.
   *
   * @since 1.2.3
   */
  id: string;

  /**
   * Regex for testing the drag `event`'s `active.id`.
   *
   * * If the regex matches, then this handler will be selected to handle the drag events.
   *
   * @since 1.2.3
   */
  test: RegExp;

  /**
   * Actual handler functions.
   *
   * @since 1.2.3
   */
  handlers: DndMuxEventHandlers;

  /**
   * Whether this input is disabled.
   *
   * @default false
   * @since 1.2.3
   */
  disabled?: boolean;
}

export interface DndMuxContextValue {
  contextId: string;
  collision: React.MutableRefObject<CollisionDetection>;
  addInput: (input: DndMuxInput) => void;
}

export const DndMuxContext = React.createContext<DndMuxContextValue>({
  contextId: null,
  collision: { current: null },
  addInput: () => void 0,
});
