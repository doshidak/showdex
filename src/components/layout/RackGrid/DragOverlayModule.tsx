import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { DragOverlay } from '@dnd-kit/core';
import { type OverlayModuleProps, OverlayModule } from './OverlayModule';

export interface DragOverlayModuleProps extends OverlayModuleProps {
  portal?: boolean;
  dropAnimationDuration?: number;
  dropAnimationFunction?: string;
  zIndex?: number;
}

export const DragOverlayModule = ({
  gridSpecs,
  portal,
  dropAnimationDuration = 300,
  dropAnimationFunction = 'ease',
  zIndex = 50,
  children,
  ...props
}: DragOverlayModuleProps): JSX.Element => {
  const gridSize = gridSpecs?.gridSize || 0;

  const dragOverlay = (
    <DragOverlay
      style={{ width: gridSize, height: gridSize }}
      dropAnimation={{ duration: dropAnimationDuration, easing: dropAnimationFunction }}
      zIndex={zIndex}
    >
      {
        !!children &&
        <OverlayModule
          {...props}
          gridSpecs={gridSpecs}
        >
          {children}
        </OverlayModule>
      }
    </DragOverlay>
  );

  return portal && typeof document !== 'undefined'
    ? ReactDOM.createPortal(dragOverlay, document.body)
    : dragOverlay;
};
