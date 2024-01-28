import * as React from 'react';
import { type DndMuxContextValue, DndMuxContext } from './DndMuxContext';

export const useDndMux: DndMuxContextValue['addInput'] = (
  input,
) => {
  const { addInput } = React.useContext(DndMuxContext);

  return addInput(input);
};
