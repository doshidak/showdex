import * as React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import useSize from '@react-hook/size';
import { useSpring } from '@react-spring/web';
import { useGesture } from '@use-gesture/react';
import cx from 'classnames';
import { useRandomUuid } from '@showdex/utils/hooks';
import { createModuleLayoutUtils } from './createModuleLayoutUtils';
import { type GridSpecs } from './Grid';
import { type ModuleProps, Module } from './Module';
import styles from './DraggableModule.module.scss';

export interface DraggableModuleProps extends ModuleProps {
  /**
   * Whether the module should be draggable.
   *
   * @default false
   * @since 1.2.3
   */
  draggable?: boolean;

  initScale?: number;
  hoverScale?: number;
  activeScale?: number;

  /**
   * Whether the module should proportionally scale to the parent element's width.
   *
   * @default true
   * @since 1.2.3
   */
  autoScale?: boolean;

  /**
   * Only used for `autoScale`, although technically not required if you're going for funky behavior.
   *
   * @since 1.2.3
   */
  gridSpecs?: GridSpecs;
}

/**
 * Kinda like `SortableModule`, but only supports dragging.
 *
 * * Imported from `@tizeio/web/components/rack/DraggableModule`.
 *
 * @since 1.2.3
 */
export const DraggableModule = ({
  className,
  style,
  w,
  h,
  draggable,
  initScale = 1,
  hoverScale = 1.025,
  activeScale = 1,
  autoScale = true,
  gridSpecs,
  children,
  ...props
}: DraggableModuleProps): JSX.Element => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  // gesture-based spring animations (i.e., for hover, active)
  const [{
    scale: containerScale,
  }, springApi] = useSpring(() => ({
    scale: initScale,

    config: {
      mass: 2,
      tension: 175,
      friction: 20,
    },
  }));

  useGesture({
    onDrag: ({ active }) => (activeScale !== initScale ? springApi.start({
      scale: active ? activeScale : initScale,
    }) : null),

    onHover: ({ hovering }) => (hoverScale !== initScale ? springApi.start({
      scale: hovering ? hoverScale : initScale,
    }) : null),
  }, {
    target: containerRef,
    eventOptions: { passive: true },
    enabled: draggable,
  });

  // measure the container's width (used for scaling later)
  const [containerWidth] = useSize(containerRef);

  // calculate supposed pixel dimensions of the module based on its size alias
  const { toPixels } = createModuleLayoutUtils(gridSpecs);

  const moduleWidth = toPixels(w);
  const moduleHeight = toPixels(h);

  // scale (via CSS transform) the module to the container's width
  const shouldScale = autoScale && moduleWidth > 0 && moduleWidth > containerWidth;
  const moduleScale = shouldScale ? (containerWidth / moduleWidth) : 1;

  // dnd-kit draggable
  const moduleId = useRandomUuid();

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    isDragging,
  } = useDraggable({
    id: moduleId,
    disabled: !moduleId || !draggable,
  });

  React.useEffect(
    () => setNodeRef(containerRef.current),
    [setNodeRef],
  );

  return (
    <Module
      ref={containerRef}
      {...props}
      {...attributes}
      {...listeners}
      role={draggable ? 'button' : undefined}
      className={cx(
        styles.container,
        draggable && styles.draggable,
        isDragging && styles.dragging,
        className,
      )}
      style={{
        ...style,
        scale: containerScale,
        transform: [
          style?.transform,
          CSS.Translate.toString(transform),
        ].filter(Boolean).join(' ') || undefined,
      }}
      tabIndex={draggable ? 0 : undefined}
      // aria-label={friendlyName || name || 'Tize Rack Module'}
    >
      <div
        style={autoScale ? {
          width: moduleWidth * moduleScale,
          height: moduleHeight * moduleScale,
        } : undefined}
      >
        {children}
      </div>
    </Module>
  );
};
