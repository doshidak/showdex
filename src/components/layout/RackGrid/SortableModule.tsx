import * as React from 'react';
import { type DraggableAttributes } from '@dnd-kit/core';
import { type SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import {
  // type AnimateLayoutChanges,
  // defaultAnimateLayoutChanges,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
// import { useSpring } from '@react-spring/web';
// import useSize from '@react-hook/size';
import cx from 'classnames';
// import { Lottie } from '@showdex/components/ui';
// import { clamp } from '@showdex/utils/core';
// import { logger } from '@showdex/utils/debug';
// import { useRandomUuid } from '@showdex/utils/hooks';
// import { type GridSpecs } from './Grid';
import { type ModuleProps, Module } from './Module';
// import { createModuleLayoutUtils } from './createModuleLayoutUtils';
// import { useRandomParticle } from './useRandomParticle';
import styles from './SortableModule.module.scss';

export interface SortableModuleProps extends Omit<ModuleProps, 'children'> {
  draggingClassName?: string;
  draggingStyle?: React.CSSProperties;
  sortableId: string;
  // itemKeyPrefix: string;
  initScale?: number;
  addScale?: number;
  springMass?: number;
  springTension?: number;
  springFriction?: number;
  lastAdded?: boolean;
  focused?: boolean;
  selected?: boolean;

  /**
   * Whether the module is able to be dragged.
   *
   * * Honestly, just been using this to also detect the `Rack`'s editing state lmao.
   *
   * @since 1.2.3
   */
  draggable?: boolean;

  /*
   * Used for calculating the grid *height* (i.e., `size.h`) of the module.
   *
   * @since 1.2.3
   */
  // gridSpecs?: GridSpecs;

  children: ((sortable?: {
    setActivatorNodeRef: (ref: HTMLElement) => void;
    attributes: DraggableAttributes;
    listeners: SyntheticListenerMap;
    dragging?: boolean;
  }) => React.ReactNode) | React.ReactNode;
}

// const l = logger('@showdex/components/layout/RackGrid/SortableModule');

// const animateLayoutChanges: AnimateLayoutChanges = (
//   args,
// ) => defaultAnimateLayoutChanges({
//   ...args,
//   wasDragging: true,
// });

/* eslint-disable jsx-a11y/no-noninteractive-tabindex */

export const SortableModule = ({
  className,
  style,
  draggingClassName,
  draggingStyle,
  sortableId,
  // itemKeyPrefix,
  w,
  h,
  // initScale = 1,
  // addScale = 0.8,
  // springMass = 1,
  // springTension = 200,
  // springFriction = 10,
  lastAdded,
  selected,
  focused,
  // inspecting,
  draggable,
  // gridSpecs,
  children: childrenFromProps,
  ...props
}: SortableModuleProps): JSX.Element => {
  const moduleRef = React.useRef<HTMLDivElement>(null);

  // calculate the pixel height of the module's content to translate into size.h
  // (especially for dynamic-height modules -- DON'T USE `ref` for useSize()!!)
  // const contentRef = React.useRef<HTMLDivElement>(null);
  // const [, moduleHeight] = useSize(contentRef);

  // const { toUnits } = createModuleLayoutUtils(gridSpecs);

  /*
  React.useEffect(() => {
    const currentH = clamp(1, h || 0);
    const calculatedH = toUnits(moduleHeight || 0, true);
    const finalH = clamp(1, calculatedH);

    // l.debug(
    //   'calculating size.h based on content height of module',
    //   '\n', 'minH', minH, 'currentH', currentH,
    //   '\n', 'calculatedH', calculatedH, 'finalH', finalH,
    // );

    if (!finalH || currentH === finalH) {
      return;
    }

    l.debug(
      'mutating size.h of module',
      '\n', 'from', currentH, 'to', finalH,
    );
  }, [
    h,
    moduleHeight,
    toUnits,
  ]);
  */

  // dnd-kit sortable
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
    isSorting,
  } = useSortable({
    id: sortableId,
    // animateLayoutChanges,
    animateLayoutChanges: () => false,
    // transition: {
    //   duration: 300,
    //   easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    // },
    disabled: !sortableId || !draggable,
  });

  React.useEffect(
    () => setNodeRef(moduleRef.current),
    [setNodeRef],
  );

  // bouncy animation when the module gets added to the DroppableGrid
  /*
  const [{ scale }, springApi] = useSpring(() => ({
    // initial: { scale: initScale },
    from: { scale: addScale },
    to: { scale: initScale },

    immediate: !lastAdded || !draggable,
    // immediate: true,
    // reset: !lastAdded,
    // reverse: lastAdded,
    // delay: !draggable ? 0 : 300,

    // loop: () => {
    //   if (springLoopIteration.current < 1) {
    //     springLoopIteration.current++;
    //
    //     return { reverse: true };
    //   }
    //
    //   return false;
    // },

    config: {
      mass: springMass,
      tension: springTension,
      friction: springFriction,
    },
  }), [
    springFriction,
    springMass,
    springTension,
  ]);

  // handle changes to lastAdded prop
  React.useEffect(() => {
    if (!draggable || !lastAdded) {
      return;
    }

    springApi.start();

    // otherwise, the module will *appear* selected,
    // but `onBlur()` won't ever fire... duh
    moduleRef.current?.focus();
  }, [
    draggable,
    lastAdded,
    springApi,
  ]);

  // grab a random Lottie animation
  const lastAddedAnimation = useRandomParticle();
  */

  const children = React.useMemo(() => (
    typeof childrenFromProps === 'function'
      ? childrenFromProps({
        setActivatorNodeRef,
        attributes,
        listeners,
        dragging: isDragging,
      })
      : childrenFromProps
  ), [
    attributes,
    childrenFromProps,
    isDragging,
    listeners,
    setActivatorNodeRef,
  ]);

  return (
    <Module
      ref={moduleRef}
      {...props}
      role={draggable ? 'button' : undefined}
      tabIndex={draggable ? 0 : undefined}
      className={cx(
        styles.container,
        draggable && styles.draggable,
        isDragging && styles.dragging,
        !isDragging && isSorting && styles.sorting,
        lastAdded && styles.lastAdded,
        selected && styles.selected,
        focused && styles.focused,
        className,
        isDragging && draggingClassName,
      )}
      style={{
        ...style,
        // scale,
        transform: [
          style?.transform,
          // isDragging && draggingStyle?.transform,
          draggingStyle?.transform,
          CSS.Translate.toString(transform),
        ].filter(Boolean).join(' ') || undefined,
        transition: [
          style?.transition,
          // isDragging && draggingStyle?.transition,
          draggingStyle?.transition,
          // 'padding 250ms ease',
          // 'box-shadow 250ms ease',
          // 'opacity 250ms ease',
          transition,
        ].filter(Boolean).join(', ') || undefined,
      }}
      w={w}
      h={h}
    >
      {/*
        (draggable && lastAdded) &&
        <Lottie
          className={styles.particles}
          asset={lastAddedAnimation}
          autoplay
          loop={false}
        />
      */}

      {/* {(
        typeof children === 'function'
          ? children({
            setActivatorNodeRef,
            attributes,
            listeners,
            dragging: isDragging,
          })
          : children
      )} */}

      {children}

      {/* <div
        className={styles.handle}
        {...attributes}
        {...listeners}
      /> */}
    </Module>
  );
};

/* eslint-enable jsx-a11y/no-noninteractive-tabindex */
