import { type SortingStrategy, arrayMove } from '@dnd-kit/sortable';
// import { logger } from '@showdex/utils/debug';
// import { pluralize } from '@showdex/utils/humanize';
import {
  type ModuleLayoutRect,
  type ModuleLayoutUtilsFactoryArgs,
  createModuleLayoutUtils,
} from './createModuleLayoutUtils';

export type GridLayoutSortingArgs = Omit<Parameters<SortingStrategy>[0], 'index' | 'activeNodeRect'>;
export type GridLayoutCalcArgs = ModuleLayoutUtilsFactoryArgs & GridLayoutSortingArgs;

// const l = logger('@showdex/components/layout/RackGrid/calcGridLayout()');
const maxAttempts = 50; // max attempts for finding a spot for a module when cursorX reaches EOL

export const calcGridLayout = ({
  columns,
  gridSize,
  gridGap,
  rects,
  activeIndex,
  overIndex,
}: GridLayoutCalcArgs): ModuleLayoutRect[] => {
  if (!rects?.length || activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
    return rects || [];
  }

  // l.debug(
  //   '\n--------------------', 'ATTENSHONE!', '--------------------',
  //   '\n', 'columns', columns, 'gridSize', gridSize, 'gridGap', gridGap,
  //   '\n', 'activeIndex', activeIndex, 'overIndex', overIndex,
  //   '\n', 'processing', ...pluralize.array(rects.length, 'module:s'), 'in rects', rects,
  //   // '\n-----------------------------------------------------',
  // );

  const {
    toTranslate,
    toModuleLayoutRects,
    getCursorX,
    fits,
  } = createModuleLayoutUtils({
    columns,
    gridSize,
    gridGap,
  });

  // convert layoutRects w/ pixel values into module layout rects w/ grid unit values
  const moduleRects = toModuleLayoutRects(rects);

  // this will act as a queue containing the swapped indices for when we populate `newRects`.
  // even though arrayMove() returns a copy of the passed-in array (i.e., `moduleRects` here),
  // we don't want any of the layout utils to consider modules we haven't processed yet!
  const movedRects = arrayMove(moduleRects, activeIndex, overIndex);

  // l.debug(
  //   'moved activeIndex', activeIndex, 'to overIndex', overIndex, 'in moduleRects', moduleRects,
  //   ...movedRects.flatMap((rect, i) => [
  //     '\n', 'index', i,
  //     'rect', rect.w, '×', rect.h, '(rect.w × rect.h)', 'at',
  //     'init position', '(', rect.initX, ',', rect.initY, ')',
  //   ]),
  //   '\n-----------------------------------------------------',
  // );

  // this will store the repositioned rects as they're calculated one-by-one lol
  const newRects: ModuleLayoutRect[] = [];

  // positional cursor (in grid units) as we add each rect
  let cursorX = 0;
  let cursorY = 0;

  let attemptsLeft = maxAttempts;

  // recalculate the positions of each rect with the swapped indices
  movedRects.forEach((rect) => {
    // l.debug(
    //   '\n--------------------', 'FOR', i, 'START', '--------------------',
    //   '\n', 'starting forEach() iteration', i, 'of', movedRects.length - 1,
    //   '\n', 'preparing to add rect', rect.w, '×', rect.h,
    //   '\n', 'cursor is at', '(', cursorX, ',', cursorY, ')',
    //   '\n', 'module spot finding attempts',
    //   ...(i > 0 && attemptsLeft !== maxAttempts ? [
    //     'reset to', maxAttempts,
    //     'from', attemptsLeft,
    //   ] : ['set to', attemptsLeft]),
    // );

    if (attemptsLeft !== maxAttempts) {
      attemptsLeft = maxAttempts;
    }

    // check if cursorX has reached EOL (end of line), i.e., value is equal to `columns`.
    // note that positional values (e.g., x, y, initX, initY, etc.) in and of themselves don't take up space.
    // it's the combination with their sizing values that causes them to occupy space.
    // in other words, that's why it's possible for cursorX to be equal to `columns`.
    const cursorEol = cursorX + rect.w > columns;

    // l.debug(
    //   'checking if cursorX is EOL...',
    //   '\n', 'cursorX', cursorX, '+', 'rect.w', rect.w, '=', cursorX + rect.w,
    //   '>', 'columns', columns, '?', cursorEol,
    // );

    if (cursorEol) {
      // we don't bother searching through the first vertical position (cursorY = 0),
      // as its perpendicular horizontal space should be occupied completely at this point
      cursorY = 1;

      // l.debug(
      //   '!', 'cursorX EOL detected', '!',
      //   '\n', 'initializing pepega space finding algorithm...',
      //   '\n', 'cursorY reset to', cursorY,
      //   '\n', 'cursor is now at', '(', cursorX, ',', cursorY, ')',
      // );

      while (!fits(newRects, rect, cursorY) && attemptsLeft > 0) {
        attemptsLeft--;

        if (attemptsLeft < 1) {
          // l.warn(
          //   '!!!', 'reached max', ...pluralize.array(maxAttempts - attemptsLeft, 'attempt:s'), '!!!',
          //   '\n', 'space finding has been halted at a potentially random spot',
          //   '\n', 'you may be observing some trippy shit (but not in a good way)',
          // );

          break;
        }

        // l.debug(
        //   'failed to fit rect', rect.w, '×', rect.h, 'at cursorY', cursorY,
        //   '\n', 'fits(newRects', newRects, ', rect', rect, ', cursorY', cursorY, ')', '=', false, /* '(obviously)', */
        //   '\n', '&&', 'attemptsLeft', attemptsLeft, '> 0', '?', attemptsLeft > 0,
        // );

        cursorY++;

        // l.debug(
        //   'completed attempt', maxAttempts - attemptsLeft, 'of', maxAttempts,
        //   '\n', 'cursor is now at', '(', cursorX, ',', cursorY, ')',
        // );
      }

      cursorX = getCursorX(newRects, cursorY);

      // l.debug(
      //   'space finding completed after', ...pluralize.array(maxAttempts - attemptsLeft, 'attempt:s'),
      //   '\n', 'found free space for rect', rect.w, '×', rect.h, 'at cursor', '(', cursorX, ',', cursorY, ')',
      //   // '\n-------------------', 'WHILE END', '-------------------',
      // );
    }

    rect.x = cursorX;
    rect.y = cursorY;

    rect.translateX = toTranslate(rect.initX, rect.x);
    rect.translateY = toTranslate(rect.initY, rect.y);

    newRects.push(rect);

    // l.debug(
    //   'translation calculated for rect', rect.w, '×', rect.h, 'at index', i, 'to',
    //   '\n', 'translate(', rect.translateX, ',', rect.translateY, ')',
    //   '\n', 'rect should move from', '(', rect.initX, ',', rect.initY, ')', 'to', '(', rect.x, ',', rect.y, ')',
    // );

    cursorX += rect.w;

    // l.debug(
    //   'finished map() iteration', i, 'of', movedRects.length - 1,
    //   '\n', 'cursor is now at', '(', cursorX, ',', cursorY, ')',
    //   '\n-------------------', 'MAP', i, 'END', '-------------------',
    // );
  });

  // since we swapped the indices earlier and all of this is happening during a drag
  // (i.e., React won't update until the drag ends since dnd-kit uses CSS transforms),
  // we needa swap them back, so that React doesn't flip shit
  return arrayMove(newRects, overIndex, activeIndex);
};
