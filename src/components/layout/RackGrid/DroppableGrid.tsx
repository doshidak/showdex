import * as React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useRandomUuid } from '@showdex/utils/hooks';
import { type GridProps, type GridSpecs, Grid } from './Grid';
import { SortableModule } from './SortableModule';
import { type RackGridProps } from './RackGrid';

export interface DroppableGridProps extends Omit<GridProps, 'interactive'> {
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  itemIds: string[];
  itemKeyPrefix: string;
  editable?: boolean;
  gridSpecs?: GridSpecs;
  lastAddedId?: string;
  focusedId?: string;
  children?: React.ReactNode;
  renderItem?: RackGridProps<React.ReactNode>['renderItem'];
}

export const DroppableGrid = React.forwardRef<HTMLDivElement, DroppableGridProps>(({
  className,
  style,
  containerClassName,
  containerStyle,
  itemIds,
  itemKeyPrefix,
  editable,
  columns,
  gridSize,
  gridGap,
  gridSpecs,
  lastAddedId,
  focusedId,
  children,
  renderItem,
  ...props
}: DroppableGridProps, forwardedRef): JSX.Element => {
  // forward the ref n shit
  const gridRef = React.useRef<HTMLDivElement>(null);

  React.useImperativeHandle(
    forwardedRef,
    () => gridRef.current,
  );

  // dnd-kit droppable
  const randomUuid = useRandomUuid();
  const droppableId = `${itemKeyPrefix}:${randomUuid}`;

  const { setNodeRef } = useDroppable({
    id: droppableId,
    disabled: !editable,
  });

  React.useEffect(
    () => setNodeRef(gridRef.current),
    [setNodeRef],
  );

  // const childrenCount = React.Children.count(childrenFromProps);
  // const lastIndex = React.useMemo(() => itemIds.findIndex((id, i) => !id || id.replace(`${itemKeyPrefix}:`, '') === String(i)), [itemIds, itemKeyPrefix]);
  // const [selectedIndex, setSelectedIndex] = React.useState<number>(null);

  /*
  const children = React.Children.map(childrenFromProps, (child, i) => (
    <SortableModule
      key={`${itemKeyPrefix}:droppable:${droppableId}:sortable:${i}`}
      style={{ width: gridSpecs?.gridSize, height: gridSpecs?.gridSize }}
      // sortableId={`${itemKeyPrefix}:${itemIds[i]}`}
      sortableId={itemIds[i]}
      // itemKeyPrefix={itemKeyPrefix}
      draggable={editable}
      lastAdded={i === lastIndex}
      selected={i === selectedIndex}
      // inspecting={instance.instanceId === inspectingId}
      // gridSpecs={gridSpecs}
      onFocus={() => setSelectedIndex(i)}
      onBlur={() => setSelectedIndex(null)}
    >
      {child}
    </SortableModule>
  ));
  */

  const items = React.useMemo(() => (
    itemIds?.length && typeof renderItem === 'function'
      ? itemIds.map((id, i) => (
        <SortableModule
          key={`${itemKeyPrefix}:droppable:${droppableId}:sortable:${i}`}
          style={{ width: gridSpecs?.gridSize, height: gridSpecs?.gridSize }}
          sortableId={id}
          // draggable={editable && !!id && id.replace(`${itemKeyPrefix}:`, '') !== String(i)}
          draggable={editable}
          lastAdded={id?.includes(lastAddedId)}
          focused={id?.includes(focusedId)}
        >
          {(sortable) => renderItem?.(id, {
            ...sortable,
            itemIndex: i,
          })}
        </SortableModule>
      ))
      : null
  ), [
    droppableId,
    editable,
    focusedId,
    gridSpecs,
    itemIds,
    itemKeyPrefix,
    lastAddedId,
    renderItem,
  ]);

  return (
    <div
      className={containerClassName}
      style={containerStyle}
    >
      <Grid
        ref={gridRef}
        {...props}
        className={className}
        style={style}
        columns={gridSpecs?.columns || columns}
        gridSize={gridSpecs?.gridSize || gridSize}
        gridGap={gridSpecs?.gridGap || gridGap}
        interactive
      >
        {items}
        {children}
      </Grid>
    </div>
  );
});
