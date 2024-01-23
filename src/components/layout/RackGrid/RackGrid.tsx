import * as React from 'react';
import { type DraggableAttributes } from '@dnd-kit/core';
import { type SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { SortableContext } from '@dnd-kit/sortable';
// import { logger } from '@showdex/utils/debug';
import { useRandomUuid } from '@showdex/utils/hooks';
import { createGridSortingStrategy } from './createGridSortingStrategy';
import { type DroppableGridProps, DroppableGrid } from './DroppableGrid';
import { type GridSpecs } from './Grid';

export interface RackGridProps<
  TItem extends React.ReactNode,
> extends Omit<DroppableGridProps, 'interactive'> {
  itemIds: string[];
  itemKeyPrefix: string;
  editable?: boolean;
  renderItem: (
    id: string,
    sortable?: {
      setActivatorNodeRef?: (ref: HTMLElement) => void;
      attributes?: DraggableAttributes;
      listeners?: SyntheticListenerMap;
      itemIndex?: number;
      dragging?: boolean;
    },
  ) => TItem;
}

// const l = logger('@showdex/components/layout/RackGrid');

/* eslint-disable @typescript-eslint/indent */

export const RackGrid = React.forwardRef<HTMLDivElement, RackGridProps<React.ReactNode>>(<
  TItem extends React.ReactNode,
>({
  className,
  columns = 1,
  minRows = 0,
  itemIds,
  itemKeyPrefix,
  gridSize,
  gridGap,
  editable,
  children,
  renderItem,
  ...props
}: RackGridProps<TItem>, forwardedRef: React.ForwardedRef<HTMLDivElement>): JSX.Element => {
  // const snapToRackGrid = React.useMemo(
  //   () => createSnapModifier(gridSize + gridGap),
  //   [gridSize, gridGap],
  // );

  // grid specs
  const gridSpecs = React.useMemo<GridSpecs>(() => ({
    columns,
    gridSize,
    gridGap,
  }), [
    columns,
    gridGap,
    gridSize,
  ]);

  const gridSortingStrategy = React.useMemo(
    () => createGridSortingStrategy(gridSpecs),
    [gridSpecs],
  );

  const randomUuid = useRandomUuid();
  const sortableId = `${itemKeyPrefix}:${randomUuid}`;

  return (
    <SortableContext
      id={sortableId}
      items={itemIds}
      strategy={gridSortingStrategy}
    >
      <DroppableGrid
        ref={forwardedRef}
        {...props}
        className={className}
        itemIds={itemIds}
        itemKeyPrefix={itemKeyPrefix}
        columns={columns}
        minRows={minRows}
        gridSize={gridSize}
        gridGap={gridGap}
        editable={editable}
        gridSpecs={gridSpecs}
        renderItem={renderItem}
      >
        {children}
      </DroppableGrid>
    </SortableContext>
  );
});

/* eslint-enable @typescript-eslint/indent */
