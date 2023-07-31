import * as React from 'react';
// import { v4 as uuidv4 } from 'uuid';
import { logger } from '@showdex/utils/debug';

export type BindThunkyActionators<
  R extends React.Reducer<unknown, unknown>,
  A extends ThunkyReducerActionator<R> | ThunkyReducerActionatorMap<R>,
> = A extends ThunkyReducerActionator<R> ?
  ThunkyReducerBindedActionator<R, A> :
  A extends ThunkyReducerActionatorMap<R> ?
    ThunkyReducerBindedActionatorMap<R, A> :
    ThunkyReducerBindedActionator<R, ThunkyReducerActionator<R>> |
    ThunkyReducerBindedActionatorMap<R, ThunkyReducerActionatorMap<R>>;

export type ThunkyReducerAction<
  R extends React.Reducer<unknown, unknown>,
  // A = React.ReducerAction<R>,
  // T = void,
  V extends void | Promise<void> = void,
> = (
  // dispatch: ThunkyReducerDispatch<R, A, T>,
  dispatch: React.Dispatch<React.ReducerAction<R>>,
  getState: () => React.ReducerState<R>,
) => V;

// export type ThunkyReducerDispatch<
//   R extends React.Reducer<unknown, unknown>,
//   A = React.ReducerAction<R> | ThunkyReducerAction<R>,
//   T = void,
// > = (action: A) => T;

export type ThunkyReducerDispatch<
  R extends React.Reducer<unknown, unknown>,
> = React.Dispatch<ThunkyReducerAction<R> | React.ReducerAction<R>>;

/**
 * *Actionator* is a portmanteau of *Action* and `Creator* (i.e., an action creator).
 */
export type ThunkyReducerActionator<
  R extends React.Reducer<unknown, unknown>,
  A extends (...args: unknown[]) => ThunkyReducerAction<R> = (...args: unknown[]) => ThunkyReducerAction<R>,
> = (...args: Parameters<A>) => ThunkyReducerAction<R, ReturnType<ReturnType<A>>>;

// export type ThunkyReducerActionator<
//   R extends React.Reducer<unknown, unknown>,
//   A = React.ReducerAction<R>,
//   T = void,
// > = (...args: unknown[]) => ThunkyReducerAction<R, A, T>;

export type ThunkyReducerActionatorMap<
  R extends React.Reducer<unknown, unknown>,
  // P extends unknown[] = unknown[],
  // A = React.ReducerAction<R>,
  // T = void,
> = Partial<Record<string, ThunkyReducerActionator<R>>>;

// export type ThunkyReducerBindedActionator<
//   R extends React.Reducer<unknown, unknown> = React.Reducer<unknown, unknown>,
//   A = React.ReducerAction<R>,
//   T = void,
// > = (...args: Parameters<ThunkyReducerActionator<R, A, T>>) => void | Promise<void>;

// export type ThunkyReducerBindedActionatorMap<
//   R extends React.Reducer<unknown, unknown> = React.Reducer<unknown, unknown>,
//   A = React.ReducerAction<R>,
//   T = void,
// > = Record<string, ThunkyReducerBindedActionator<R, A, T>>;

// export type ThunkyReducerBindedActionator<
//   P extends unknown[] = unknown[],
// > = (...args: P) => void | Promise<void>;

export type ThunkyReducerBindedActionator<
  R extends React.Reducer<unknown, unknown>,
  A extends ThunkyReducerActionator<R>,
> = (...args: Parameters<A>) => ReturnType<ReturnType<A>>;

// export type ThunkyReducerBindedActionatorMap<
//   P extends unknown[] = unknown[],
// > = Record<string, ThunkyReducerBindedActionator<P>>;

export type ThunkyReducerBindedActionatorMap<
  R extends React.Reducer<unknown, unknown>,
  M extends ThunkyReducerActionatorMap<R>,
> = {
  [K in keyof M]: ThunkyReducerBindedActionator<R, M[K]>;
};

/**
 * @todo this is for when you add `redux-devtools-extension` support.
 * (although the default value for `name` in `redux-devtools-extension` is the value of `document.title`.)
 * @see https://github.com/intergalacticspacehighway/use-reducer-thunk/blob/master/src/index.js
 */
// const parseReducerName = (name: string) => `ThunkyReducer:${name || `untitled-${uuidv4()}`}`;

const l = logger('@showdex/utils/hooks/useThunkyReducer()');

/* eslint-disable @typescript-eslint/indent */

/**
 * Everything you know and love about React's `useReducer()` hook,
 * but now with extra *t h u n k* in the *t r u n k* !
 *
 * * Based off of *intergalaticspacehighway*'s `use-reducer-thunk`, *reduxjs*'s `redux-thunk` & `react-redux`.
 * * Notable differences from `use-reducer-thunk` include:
 *   - Completely typed.
 *   - `bindActionCreator()`/`bindActionCreators()` support.
 *   - No `redux-devtools-extension` support (yet).
 *
 * @see https://github.com/intergalacticspacehighway/use-reducer-thunk
 * @since 0.1.0
 */
export const useThunkyReducer = <
  R extends React.Reducer<unknown, unknown>,
>(
  reducer: R,
  initialState: React.ReducerState<R>,
): [
  state: React.ReducerState<R>,
  dispatch: ThunkyReducerDispatch<R>,
] => {
  const [state, dispatch] = React.useReducer(reducer, initialState);

  const thunkyDispatch: ThunkyReducerDispatch<R> = (action) => {
    if (typeof action === 'function') {
      // l.debug('thunkyDispatch() -> action(dispatch, getState)');

      return (<ThunkyReducerAction<R>> action)(dispatch, () => state);
    }

    // l.debug('thunkyDispatch() -> dispatch(action)');

    dispatch(action);
  };

  return [state, thunkyDispatch];
};

/**
 * Wraps a **single** reducer `actionator` with `dispatch()`,
 * so that the function can be called normally without worrying about passing the actionator's return value to `dispatch()`.
 *
 * * Works similarly to `bindActionCreator()` (read: singular *action creator*) in `react-redux`.
 *
 * @see https://github.com/reduxjs/redux/blob/master/src/bindActionCreators.ts#L9-L16
 * @since 0.1.0
 */
export const bindThunkyActionator = <
  R extends React.Reducer<unknown, unknown>,
  // A extends (...args: unknown[]) => unknown = () => unknown,
>(
  actionator: ThunkyReducerActionator<R>,
  dispatch: ThunkyReducerDispatch<R>,
): ThunkyReducerBindedActionator<R, typeof actionator> => {
  if (typeof actionator !== 'function') {
    l.warn(
      'bindThunkyActionator()',
      '\n', 'your actionator ain\'t a function, so not much action will be happening, ja feel',
      '\n', 'typeof actionator', typeof actionator, '(expected: function)',
    );

    return null;
  }

  if (typeof dispatch !== 'function') {
    l.warn(
      'bindThunkyActionator()',
      '\n', 'yo dawg, think you forgot to pass-in dispatch() for the second arg lol',
      '\n', 'typeof dispatch', typeof dispatch, '(expected: function)',
    );

    return null;
  }

  return (...args: Parameters<typeof actionator>) => dispatch(actionator(...args));
};

/**
 * Wraps a reducer `actionator` or a mapping of `actionator`'s with `dispatch()`,
 * so that the `actionator`('s) can be called as a normal function without worrying about dispatching.
 *
 * * Work's similarly to `bindActionCreators()` (read: plural *action creators*) from `react-redux`.
 * * According to Redux's documentation on `bindActionCreators()`,
 *   the only use case for this is to not expose `dispatch()` to the child component.
 * * If you pass in a mapping for `actionators`, have fun trying to type that shit lol.
 *
 * @see https://redux.js.org/api/bindactioncreators
 * @see https://github.com/reduxjs/redux/blob/master/src/bindActionCreators.ts#L58-L83
 * @since 0.1.0
 */
export const bindThunkyActionators = <
  R extends React.Reducer<unknown, unknown> = React.Reducer<unknown, unknown>,
  // A extends (...args: unknown[]) => unknown = () => unknown,
>(
  actionators: ThunkyReducerActionator<R> | ThunkyReducerActionatorMap<R>,
  dispatch: ThunkyReducerDispatch<R>,
): BindThunkyActionators<R, typeof actionators> => {
  if (typeof actionators === 'function') {
    return bindThunkyActionator(actionators, dispatch);
  }

  const mappedActionators = Object.entries<ThunkyReducerActionator<R>>(actionators).reduce((prev, entry, i) => {
    const [key, actionator] = entry || [];

    // could be a falsy string as the key
    if (!key && typeof key !== 'string') {
      l.warn(
        'bindThunkyActionators()',
        '\n', 'did you forget to provide a key for one of your mapped actionators?',
        '\n', 'typeof key', typeof key, '(expected: string)',
        '\n', 'typeof actionator', typeof actionator, '(expected: function)',
        '\n', 'Object.entries(actionators) index', i,
        '\n', 'actionators', actionators,
      );

      return prev;
    }

    prev[key] = bindThunkyActionator<R>(actionator, dispatch);

    return prev;
  }, <ThunkyReducerBindedActionatorMap<R, typeof actionators>> {});

  return mappedActionators;
};

/**
 * Convenient memoization hook for binded actionators via `React.useMemo()` & `bindThunkyActionators()`.
 */
export const useThunkyBindedActionators = <
  R extends React.Reducer<unknown, unknown>,
  A extends ThunkyReducerActionator<R> | ThunkyReducerActionatorMap<R>,
  // P extends unknown[] = unknown[],
>(
  actionators: ThunkyReducerActionator<R> | ThunkyReducerActionatorMap<R>,
  dispatch: ThunkyReducerDispatch<R>,
): BindThunkyActionators<R, A> => React.useMemo(
  () => <BindThunkyActionators<R, A>> bindThunkyActionators(actionators, dispatch),
  [actionators, dispatch],
);

/* eslint-enable @typescript-eslint/indent */
