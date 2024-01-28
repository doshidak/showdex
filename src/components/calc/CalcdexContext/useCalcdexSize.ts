import * as React from 'react';
import { calcdexSlice, useDispatch } from '@showdex/redux/store';
import { tolerance } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { useElementSize } from '@showdex/utils/hooks';
import { CalcdexContext } from './CalcdexContext';

const l = logger('@showdex/components/calc/useCalcdexSize()');

export const useCalcdexSize = (
  containerRef: React.MutableRefObject<HTMLDivElement>,
): void => {
  const { state } = React.useContext(CalcdexContext);
  const dispatch = useDispatch();

  const {
    width,
    height,
    size,
  } = useElementSize(containerRef, {
    initialWidth: 320,
    initialHeight: 700,
  });

  React.useEffect(() => {
    // need to check width & height so the `size` doesn't reset to 'xs' when the containerRef is unmounting
    const shouldIgnore = !width
      || !height
      || !size
      || (size === state?.containerSize && tolerance(state?.containerWidth, 10)(width));

    if (shouldIgnore) {
      return;
    }

    dispatch(calcdexSlice.actions.update({
      scope: l.scope,
      battleId: state.battleId,
      containerSize: size,
      containerWidth: width,
    }));
  }, [
    dispatch,
    height,
    size,
    state?.battleId,
    state?.containerSize,
    state?.containerWidth,
    width,
  ]);
};
