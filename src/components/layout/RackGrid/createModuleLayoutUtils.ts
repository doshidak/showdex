import { type ClientRect } from '@dnd-kit/core';
import { type GridSpecs } from './Grid';

export interface ModuleLayoutRect extends ClientRect {
  /**
   * Actual width of the module, in *grid units*.
   *
   * @default null
   * @since 1.2.3
   */
  w?: number;

  /**
   * Actual height of the module, in *grid units*.
   *
   * @default null
   * @since 1.2.3
   */
  h?: number;

  /**
   * Current horizontal position within the grid, in *grid units*.
   *
   * * Before the new layout is re-calculated, this value will be the same as `initX`.
   * * Afterwards, the re-calculated value (in *grid units*) will be stored here, which is then used to calculate `translateX`.
   *
   * @since 1.2.3
   */
  x?: number;

  /**
   * Current vertical position within the grid, in *grid units*.
   *
   * * Before the new layout is re-calculated, this value will be the same as `initY`.
   * * Afterwards, the re-calculated value (in *grid units*) will be stored here, which is then used to calculate `translateY`.
   *
   * @since 1.2.3
   */
  y?: number;

  /**
   * Initial horizontal position within the grid, in *grid units*.
   *
   * * This value is calculated from the difference between `offsetLeft` & `baseLeft`, in which the resulting value is
   *   then converted from *pixels* to *grid units*.
   *
   * @since 1.2.3
   */
  initX?: number;

  /**
   * Initial vertical position within the grid, in *grid units*.
   *
   * * This value is calculated from the difference between `offsetTop` & `baseTop`, in which the resulting value is
   *   then converted from *pixels* to *grid units*.
   *
   * @since 1.2.3
   */
  initY?: number;

  /**
   * Horizontal translation amount relative to the module's current horizontal position, in *pixels*.
   *
   * * This value is calculated from the difference between `x` & `initX`, in which the resulting value is then
   *   converted from *grid units* to *pixels*.
   *
   * @since 1.2.3
   */
  translateX?: number;

  /**
   * Vertical translation amount relative to the module's current vertical position, in *pixels*.
   *
   * * This value is calculated from the difference between `y` & `initY`, in which the resulting value is then
   *   converted from *grid units* to *pixels*.
   *
   * @since 1.2.3
   */
  translateY?: number;
}

export interface ModuleLayoutUtils {
  /**
   * Converts a value in *pixels* to *grid units*.
   *
   * * Note that the passed-in `px` value should also include `gridGap`s.
   *
   * @param px Value in *pixels* to convert into *grid units*.
   * @param ceil Whether to ceil the resulting value; otherwise, round it.
   * @returns Converted value in *grid units*.
   * @since 1.2.3
   */
  toUnits: (px: number, ceil?: boolean) => number;

  /**
   * Converts a value in *grid units* to *pixels*.
   *
   * * Note that this will account for `gridGap`s in-between each *grid unit*,
   *   but not any `gridGap`s that appear before or after the first or last block.
   *
   * @param units Number of *grid units* to convert into *pixels*.
   * @returns Converted value in *pixels*.
   * @since 1.2.3
   */
  toPixels: (units: number) => number;

  /**
   * Calculates the translation amount in *pixels* from the initial & current positions in *grid units* of the module.
   *
   * * Unlike the `toPixels()` utility,
   *   this will correctly account for any `gridGap`s that lie before or after the module.
   *
   * @param fromUnit Initial positional value in *grid units*.
   * @param toUnit Final positional value after layout re-calculation in *grid units*.
   * @returns Amount to translate relative to the module's current position in *pixels*.
   * @since 1.2.3
   */
  toTranslate: (fromUnit: number, toUnit: number) => number;

  /**
   * Finds the baseline top offset from the given list of layout rects.
   *
   * @param rects List of layout rects to find the baseline top offset from.
   * @returns Baseline top offset in *pixels*.
   * @since 1.2.3
   */
  getBaseTop: (rects: ClientRect[]) => number;

  /**
   * Finds the baseline left offset from the given list of layout rects.
   *
   * @param rects List of layout rects to find the baseline left offset from.
   * @returns Baseline left offset in *pixels*.
   * @since 1.2.3
   */
  getBaseLeft: (rects: ClientRect[]) => number;

  /**
   * Converts a list of layout rects into module layout rects,
   * which adds sizing & positional properties (in *grid units*),
   * in addition to the existing layout rect properties (whose values are in *pixels*).
   *
   * * This utility does not modify the passed-in `rects` array & returns a copy instead.
   *
   * @param rects List of layout rects to convert.
   * @returns New list of module layout rects.
   * @since 1.2.3
   */
  toModuleLayoutRects: (rects: ClientRect[]) => ModuleLayoutRect[];

  /**
   * Finds any module layout rects that horizontally intersects at the given `y`.
   *
   * Mathematically, the horizontal intersection is perpendicular/orthogonal/normal to the `y` value.
   * Not-so-mathemagically, you can visualize a **thicc boi** with the following properties:
   * * a width (`rect.w`) equal to the value of `columns`,
   * * a height (`rect.h`) of `1`,
   * * a horizontal position (`rect.x`) at `0`, &
   * * a vertical position (`rect.y`) at the given `y`.
   *
   * Basically, any module layout rect that intersects with that imaginary **thicc boi** will be included in the results.
   *
   * Note that the resulting rects may not necessarily have a `rect.y` value equal to the given `y`.
   * In that case, the intersecting rect would be a ***tall* boi** with a high `rect.h` value & a lower `rect.y` value.
   *
   * @param rects List of module layout rects.
   * @param y Vertical position in *grid units* of the horizontal cross-section for the intersection test.
   * @param exclude Optional index in `rects` to exclude from the test.
   * @returns List of module layout rects that intersected with the cross-section.
   * @since 1.2.3
   */
  getIntersectingRects: (
    rects: ModuleLayoutRect[],
    y: number,
    exclude?: number,
  ) => ModuleLayoutRect[];

  /**
   * Sums the widths of all intersecting module layout rects at the given `y`,
   * including elements that don't start at `y`.
   *
   * * Note that this does not validate the result (i.e., could be negative, `NaN`, or beyond the `column` value).
   *
   * @param rects List of module layout rects.
   * @param y Vertical position in *grid units* for the corresponding `x` value that will be returned.
   * @param exclude Optional index in `rects` to exclude from the calculation.
   * @returns Furthest (rightmost) horizontal *x* value in *grid units* for the given `y`.
   * @since 1.2.3
   */
  getCursorX: (
    rects: ModuleLayoutRect[],
    y: number,
    exclude?: number,
  ) => number;

  /**
   * Counts the number of empty horizontal spaces at the given `y`.
   * This value would at most be equal to `columns`.
   *
   * * Note that this does not determine *where* the free spaces are, just how many.
   * * Additionally, the resulting value is not validated, so this can return negative or `NaN` values.
   *
   * @param rects List of module layout rects.
   * @param y Vertical position in *grid units* to count the number of empty horizontal spaces at.
   * @param exclude Optional index in `rects` to exclude from the calculation.
   * @returns Number of empty spaces for the given `y`.
   * @since 1.2.3
   */
  countFreeSpaces: (
    rects: ModuleLayoutRect[],
    y: number,
    exclude?: number,
  ) => number;

  /**
   * Determines if the *entire* module rect (based on its `rect.w` & `rect.h`) can fit at the given `y`.
   *
   * While this utility does take the height (`rect.h`) into account,
   * it only does so by checking *how many* free spaces there are (for every `y` value occupied by `rect.h`), not *where*.
   *
   * As long as consistent sizes are enforced for module rects,
   * this should get the job done (for the most part, maybe).
   *
   * @param rects List of module layout rects.
   * @param rect Module layout rect to test fit for in `rects`. This need not be in `rects`.
   * @param y Optional vertical position (in *grid units*) to test at. If omitted, `rects[index].y` will be used instead.
   * @param exclude Optional index in `rects` to exclude from the test.
   * @returns `true` if the module layout rect fits at the given `y`, `false` otherwise.
   * @since 1.2.3
   */
  fits: (
    rects: ModuleLayoutRect[],
    rect: ModuleLayoutRect,
    y?: number,
    exclude?: number,
  ) => boolean;
}

/* eslint-disable @typescript-eslint/indent -- this rule is broken af. see Issue #1824 in the typescript-eslint GitHub repo. */

export type ModuleLayoutUtilsFactoryArgs = GridSpecs;

/* eslint-enable @typescript-eslint/indent */

export type ModuleLayoutUtilsFactory = (args: ModuleLayoutUtilsFactoryArgs) => ModuleLayoutUtils;

// const l = logger('@web/components/rack/Module/createModuleLayoutUtils()');

/**
 * Some super-contrived crazy grid masonry layout thingy I wrote a couple years ago o_O
 *
 * * dat shit cray
 * * Imported from `@tizeio/web/components/rack/Module`.
 *
 * @since 1.2.3
 */
export const createModuleLayoutUtils: ModuleLayoutUtilsFactory = ({
  columns = 1,
  gridSize = 100,
  gridGap = 0,
}) => {
  const toUnits: ModuleLayoutUtils['toUnits'] = (
    px,
    ceil,
  ) => Math[ceil ? 'ceil' : 'round']((px + gridGap) / ((gridSize + gridGap) || 1));

  const toPixels: ModuleLayoutUtils['toPixels'] = (
    units,
  ) => (units * gridSize) + ((units < 0 ? -1 : 1) * (Math.max(Math.abs(units), 1) - 1) * gridGap);

  const toTranslate: ModuleLayoutUtils['toTranslate'] = (
    fromUnit,
    toUnit,
  ) => {
    let translate = toPixels(toUnit - fromUnit);

    // in this case, we need to account for an additional gridGap since the module seems to be moving
    // from an axis edge (x &/or y = 0) to some inward position (x &/or y > 0), or vice versa
    if (translate !== 0 && (fromUnit === 0 || toUnit === 0)) {
      translate += (translate < 0 ? -1 : 1) * gridGap;
    }

    return translate;
  };

  // NOTE: possible performance optimization may be to sort the rects by `top` in asc/desc, then shift()/pop() the lowest `top` value
  // (same optimization can be applied to getBaseLeft())
  const getBaseTop: ModuleLayoutUtils['getBaseTop'] = (rects) => rects
    ?.reduce?.((top, rect) => (!top ? (rect?.top || 0) : Math.min(top, rect?.top || top)), 0)
    || 0;

  const getBaseLeft: ModuleLayoutUtils['getBaseLeft'] = (rects) => rects
    ?.reduce?.((left, rect) => (!left ? (rect?.left || 0) : Math.min(left, rect?.left || left)), 0)
    || 0;

  const toModuleLayoutRects: ModuleLayoutUtils['toModuleLayoutRects'] = (rects) => {
    const baseTop = getBaseTop(rects);
    const baseLeft = getBaseLeft(rects);

    return rects?.map?.((rect) => {
      const {
        left = baseLeft,
        top = baseTop,
        width = 1,
        height = 1,
      } = rect || {};

      const initX = toUnits(left - baseLeft);
      const initY = toUnits(top - baseTop);

      return {
        ...rect,
        w: toUnits(width),
        h: toUnits(height),
        x: initX,
        y: initY,
        initX,
        initY,
        translateX: 0,
        translateY: 0,
      };
    }) || [];
  };

  const getIntersectingRects: ModuleLayoutUtils['getIntersectingRects'] = (
    rects,
    y,
    exclude = -1,
  ) => rects
    ?.filter?.((rect, i) => (exclude < 0 || i !== exclude) && rect.y <= y && rect.y + rect.h > y)
    || [];

  const getCursorX: ModuleLayoutUtils['getCursorX'] = (
    rects,
    y,
    exclude,
  ) => {
    const intersectingRects = getIntersectingRects(rects, y, exclude);
    const seemsOffset = y > 0 && intersectingRects.every((rect) => rect.x > 0);
    // const cursorX = intersectingRects.reduce((x, rect) => x + rect.w, 0);
    const cursorX = seemsOffset ? 0 : intersectingRects.reduce((x, rect) => x + rect.w, 0);

    // l.debug(
    //   'getCursorX(rects', rects, ', y', y, /* ', exclude?', exclude, */ ')', '=', cursorX,
    //   '\n', 'intersectingRects', intersectingRects, 'seemsOffset', seemsOffset,
    // );

    return cursorX;
  };

  const countFreeSpaces: ModuleLayoutUtils['countFreeSpaces'] = (
    rects,
    y,
    exclude,
  ) => {
    const intersectingRects = getIntersectingRects(rects, y, exclude);
    const numUsed = intersectingRects.reduce((w, rect) => w + rect.w, 0);
    const numFree = columns - numUsed;

    // l.debug('countFreeSpaces(rects', rects, ', y', y, /* ', exclude?', exclude, */ ')', '=', numFree);

    return numFree;
  };

  const fits: ModuleLayoutUtils['fits'] = (
    rects,
    rect,
    y,
    exclude,
  ) => Array(rect?.h || 0).fill(null)
    .every((_null, i) => countFreeSpaces(rects, (y || rect.y) + i, exclude) >= rect.w);

  return {
    toUnits,
    toPixels,
    toTranslate,
    getBaseTop,
    getBaseLeft,
    toModuleLayoutRects,
    getIntersectingRects,
    getCursorX,
    countFreeSpaces,
    fits,
  };
};
