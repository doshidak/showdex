import * as React from 'react';
import { hellodexSlice, useDispatch, useHellodexState } from '@showdex/redux/store';
import { useElementSize } from '@showdex/utils/hooks';

export const useHellodexSize = (
  containerRef: React.MutableRefObject<HTMLDivElement>,
): void => {
  const state = useHellodexState();
  const dispatch = useDispatch();

  const {
    width,
    height,
    size,
  } = useElementSize(containerRef, {
    initialWidth: 400,
    initialHeight: 700,
  });

  React.useEffect(() => {
    if (!width || !height || !size || size === state?.containerSize) {
      return;
    }

    dispatch(hellodexSlice.actions.update({
      containerSize: size,
    }));
  }, [
    dispatch,
    height,
    size,
    state?.containerSize,
    width,
  ]);
};
