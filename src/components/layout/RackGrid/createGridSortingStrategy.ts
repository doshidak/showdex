import { type SortingStrategy } from '@dnd-kit/sortable';
// import { logger } from '@showdex/utils/debug';
import { type ModuleLayoutUtilsFactoryArgs } from './createModuleLayoutUtils';
import { calcGridLayout } from './calcGridLayout';

// const l = logger('@showdex/components/layout/RackGrid/createGridSortingStrategy()');

export const createGridSortingStrategy = ({
  ...gridSpecs
}: ModuleLayoutUtilsFactoryArgs): SortingStrategy => ({
  rects,
  activeIndex,
  overIndex,
  index,
}) => {
  if (!Array.isArray(rects) || !rects.length) {
    return null;
  }

  if (activeIndex === overIndex) {
    // l.debug('activeIndex is equal to overIndex; this call will be ignored');

    return null;
  }

  const gridLayoutRects = calcGridLayout({
    ...gridSpecs,
    rects,
    activeIndex,
    overIndex,
  });

  const rect = gridLayoutRects[index];

  // l.info(
  //   'received rect', rect.w, '×', rect.h, 'at index', index, 'from rects', rects,
  //   '\n', 'applying transform(', rect.translateX, ',', rect.translateY, ')',
  //   '\n', 'rect should move from', '(', rect.initX, ',', rect.initY, ')', 'to', '(', rect.x, ',', rect.y, ')',
  //   '\n-------------------', 'FUNC  END', '-------------------',
  // );

  return {
    x: rect.translateX,
    y: rect.translateY,
    scaleX: 1,
    scaleY: 1,
  };
};
