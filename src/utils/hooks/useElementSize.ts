import * as React from 'react';
import useSize from '@react-hook/size';

export type ElementSizeLabel =
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl';

export interface ElementSizeHookOptions {
  /**
   * Initial width of the provided `target`.
   *
   * @default 0
   * @since 1.0.5
   */
  initialWidth?: number;

  /**
   * Initial height of the provided `target`.
   *
   * @default 0
   * @since 1.0.5
   */
  initialHeight?: number;

  /**
   * Pixel breakpoint values for each label.
   *
   * * Note that these default breakpoints are specifically made for Showdown.
   * * Values specified here will be merged with those in `ElementSizeDefaultBreakpoints`.
   *
   * @since 1.0.5
   */
  breakpoints?: Partial<Record<ElementSizeLabel, number>>;
}

export interface ElementSizeHookResult {
  width: number;
  height: number;
  size: ElementSizeLabel;
}

export const ElementSizeDefaultBreakpoints: Record<ElementSizeLabel, number> = {
  xs: 380,
  sm: 550,
  md: 750,
  lg: 900,
  xl: 1100,
};

/**
 * Provides a label for the detected width of the provided `target` reference.
 *
 * * HUH
 *
 * @since 1.0.5
 */
export const useElementSize = <T extends HTMLElement>(
  target: React.MutableRefObject<T>,
  options?: ElementSizeHookOptions,
): ElementSizeHookResult => {
  const {
    initialWidth = 0,
    initialHeight = 0,
    breakpoints: breakpointOverrides,
  } = options || {};

  const [
    width,
    height, // not using this, but providing it anyways just in case lol
  ] = useSize(target, {
    initialWidth,
    initialHeight,
  });

  // setting the initial ordering of the keys from the defaults
  // (any overrides will override the existing key's value, but not change its order)
  const breakpoints = {
    ...ElementSizeDefaultBreakpoints,
    ...breakpointOverrides,
  };

  const sizes = Object.entries(breakpoints).sort(([, a], [, b]) => b - a) as [ElementSizeLabel, number][];
  const size = (sizes.find(([, breakpoint]) => width >= breakpoint) || sizes.slice(-1)[0])?.[0];

  return {
    width,
    height,
    size,
  };
};
