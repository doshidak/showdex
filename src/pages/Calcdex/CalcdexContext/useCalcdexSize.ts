import * as React from 'react';
import { calcdexSlice, useDispatch } from '@showdex/redux/store';
import { logger } from '@showdex/utils/debug';
import { useElementSize } from '@showdex/utils/hooks';
import { CalcdexContext } from './CalcdexContext';

const l = logger('@showdex/pages/Calcdex/CalcdexContext/useCalcdexSize()');

export const useCalcdexSize = (
  containerRef: React.MutableRefObject<HTMLDivElement>,
  initialSize?: {
    width?: number;
    height?: number;
  },
): void => {
  const { state } = React.useContext(CalcdexContext);
  const dispatch = useDispatch();

  const {
    width,
    height,
    size,
  } = useElementSize(containerRef, {
    initialWidth: initialSize?.width || 400,
    initialHeight: initialSize?.height || 700,
  });

  React.useEffect(() => {
    // need to check width & height so the `size` doesn't reset to 'xs' when the containerRef is unmounting
    if (!width || !height || !size || state?.containerSize === size) {
      return;
    }

    dispatch(calcdexSlice.actions.update({
      scope: l.scope,
      battleId: state.battleId,
      containerSize: size,
    }));
  }, [
    dispatch,
    height,
    size,
    state?.battleId,
    state?.containerSize,
    width,
  ]);
};
