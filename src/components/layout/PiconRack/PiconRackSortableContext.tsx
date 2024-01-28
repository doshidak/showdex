import * as React from 'react';
import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { type CalcdexPlayerKey } from '@showdex/interfaces/calc';
// import { createGridSortingStrategy } from '../RackGrid';
import { PiconRackContext } from './PiconRackContext';

export interface PiconRackSortableContextProps {
  playerKey: CalcdexPlayerKey;
  children: React.ReactNode;
}

export const PiconRackSortableContext = ({
  playerKey,
  children,
}: PiconRackSortableContextProps): JSX.Element => {
  const ctx = React.useContext(PiconRackContext);

  // const sortingStrategy = React.useMemo(
  //   () => createGridSortingStrategy(ctx.gridSpecs),
  //   [ctx.gridSpecs],
  // );

  return (
    <SortableContext
      id={ctx.containerIds[playerKey]}
      items={ctx[playerKey] || []}
      // strategy={sortingStrategy}
      strategy={rectSortingStrategy}
    >
      {children}
    </SortableContext>
  );
};
