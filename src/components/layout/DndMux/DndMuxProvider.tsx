import * as React from 'react';
import {
  type CollisionDetection,
  // closestCenter,
  DndContext,
  KeyboardSensor,
  MeasuringFrequency,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
// import { logger } from '@showdex/utils/debug';
import { useRandomUuid } from '@showdex/utils/hooks';
import {
  type DndMuxContextValue,
  type DndMuxEventHandlers,
  type DndMuxInput,
  type DragEvent,
  DndMuxContext,
} from './DndMuxContext';

export interface DndMuxProviderProps {
  children?: React.ReactNode;
}

// const l = logger('@showdex/components/layout/DndMuxProvider');

/**
 * Multiplexer provider for pseudo-`DndContext`s.
 *
 * * tfw you discover you can nest `DndContext`s, but the events don't bubble up.
 *   - i.e., the closest `DndContext` to the draggables will only receive the events.
 * * This is a solution to the event bubbling problem by only having a singular root `DndContext`.
 *   - All drag & drop events (of `dnd-kit` origin) are funneled through this `DndContext`, then depending on the
 *     `event`'s `active.id`, a pseudo-`DndContext` receives the events.
 *   - Pseudo-`DndContext`s are normally `DndContext`s, but due to this limitation, must use this context's `useDndMux()`
 *     hook to register their event handlers.
 * * Supports multiple registered handlers ("inputs") with the same `test` value.
 *   - All matching inputs will receive a callback for the triggered drag event.
 *   - Re-registrations of an existing `id` will update the corresponding input's `handlers`.
 * * Imported from `@tizeio/web/components/layout/DndMux`.
 *
 * @see https://github.com/clauderic/dnd-kit/discussions/280
 * @since 1.2.3
 */
export const DndMuxProvider = ({
  children,
}: DndMuxProviderProps): JSX.Element => {
  // dnd context sensors
  const sensors = useSensors(
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }), // distance required otherwise clicking breaks
    useSensor(TouchSensor),
  );

  const collision = React.useRef<CollisionDetection>(null);

  // registered event handlers
  // (inputs are added by the useDndMux() hook)
  const contextId = useRandomUuid();
  const inputs = React.useRef<DndMuxInput[]>([]);

  const providerValue = React.useMemo<DndMuxContextValue>(() => ({
    contextId,
    collision,
    addInput: (input) => {
      if (!input?.id || input.disabled) {
        return;
      }

      const existing = inputs.current.find((i) => i.id === input.id);

      if (existing) {
        if (input.handlers) {
          existing.handlers = input.handlers;
        }

        return;
      }

      // l.debug(
      //   'addInput()',
      //   '\n', 'adding input with id', input.id, input,
      // );

      // setInputs((prevInputs) => [
      //   ...prevInputs,
      //   input,
      // ]);

      inputs.current.push(input);
    },
  }), [
    contextId,
    inputs,
  ]);

  // fyi, DragMoveEvent is basically the un-exported DragEvent,
  // which is the base class for all drag events (except for DragStartEvent, hence the partial lmao),
  // so you can use this for your all your registration finding needs c:
  const getMatchingInputs = (
    event: DragEvent,
    name?: keyof DndMuxEventHandlers,
  ) => (
    event?.active?.id
      ? inputs.current.filter(({
        test,
        handlers,
        disabled,
      }) => (
        test.test(String(event.active.id))
          && !disabled
          && (!name || typeof handlers?.[name] === 'function')
      ))
      : null
  );

  // don't get lost in the bind arrows :o
  // this function's (or a factory, technically) return type is `(event: DragEvent) => void`
  const createOutput = (
    name: keyof DndMuxEventHandlers,
  ): (event: DragEvent) => void => (
    event,
  ) => {
    const matches = getMatchingInputs(event, name);

    if (!matches?.length) {
      return;
    }

    // l.debug(
    //   'createOutput()', '->', `${name}()`,
    //   ...matches.map(({ id }) => `\n > ${id}`),
    // );

    matches.forEach((input) => {
      input.handlers[name](event);
    });
  };

  return (
    <DndMuxContext.Provider value={providerValue}>
      <DndContext
        id={contextId}
        sensors={sensors}
        collisionDetection={collision.current}
        measuring={{
          droppable: {
            frequency: MeasuringFrequency.Optimized,
            strategy: MeasuringStrategy.Always,
          },
        }}
        onDragStart={createOutput('onDragStart')}
        onDragMove={createOutput('onDragMove')}
        onDragOver={createOutput('onDragOver')}
        onDragEnd={createOutput('onDragEnd')}
        onDragCancel={createOutput('onDragCancel')}
      >
        {children}
      </DndContext>
    </DndMuxContext.Provider>
  );
};
