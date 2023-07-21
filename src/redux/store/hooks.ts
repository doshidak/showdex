import {
  type TypedUseSelectorHook,
  useDispatch as useReduxDispatch,
  useSelector as useReduxSelector,
} from 'react-redux';
import { type RootState, type RootDispatch } from './createStore';

/**
 * Typed version of `useDispatch()` from `react-redux`.
 *
 * @since 0.1.0
 */
export const useDispatch = () => useReduxDispatch<RootDispatch>();

/**
 * Typed version of `useSelector()` from `react-redux`.
 *
 * @since 0.1.0
 */
export const useSelector: TypedUseSelectorHook<RootState> = useReduxSelector;
