/**
 * @file `createStore.ts`
 * @author Keith Choison <keith@tize.io>
 * @since 0.1.3
 */

import {
  type Action,
  type Dispatch,
  type UnknownAction,
  type ConfigureStoreOptions,
  type ThunkDispatch,
  configureStore,
} from '@reduxjs/toolkit';
// import { setupListeners } from '@reduxjs/toolkit/query/react';
import { logger } from '@showdex/utils/debug';
import { pkmnApi, showdownApi } from '@showdex/redux/services';
import { type CalcdexSliceState, calcdexSlice } from './calcdexSlice';
import { type HellodexSliceState, hellodexSlice } from './hellodexSlice';
import { type NotedexSliceState, notedexSlice } from './notedexSlice';
import { type ShowdexSliceState, showdexSlice } from './showdexSlice';
import { type TeamdexSliceState, teamdexSlice } from './teamdexSlice';

export type RootStore = ReturnType<typeof createStore>;
// RTK v2: configureStore's inferred dispatch may not preserve ThunkDispatch through the options spread —
// explicitly include ThunkDispatch so async thunk actions can be dispatched via RootDispatch.
export type RootDispatch = ThunkDispatch<ReturnType<RootStore['getState']>, unknown, UnknownAction> & Dispatch<UnknownAction>;

export interface RootState extends ReturnType<RootStore['getState']> {
  [showdexSlice.name]: ShowdexSliceState;
  [hellodexSlice.name]: HellodexSliceState;
  [notedexSlice.name]: NotedexSliceState;
  [calcdexSlice.name]: CalcdexSliceState;
  [teamdexSlice.name]: TeamdexSliceState;
}

/**
 * Options for the `createStore()` factory.
 *
 * @since 1.0.0
 */
export type CreateReduxStoreOptions<
  TState = unknown,
  TAction extends Action = UnknownAction,
  // TMiddlewares extends Middlewares<TState> = Middlewares<TState>,
> = Omit<Partial<ConfigureStoreOptions<TState, TAction>>, 'middleware' | 'reducer'>;

const l = logger('@showdex/redux/store/createStore()');

/**
 * A friendly abstraction for another friendly abstraction, RTK's `configureStore()`.
 *
 * @example
 * ```tsx
 * const store = createStore();
 * const App = ({ Component, pageProps }: AppProps): React.JSX.Element => (
 *   <Provider store={store}>
 *     <Component {...pageProps} />
 *   </Provider>
 * );
 * ```
 * @since 0.1.3
 */
export const createStore = (
  options?: CreateReduxStoreOptions,
) => {
  const store = configureStore({
    ...options,

    // devTools: __DEV__, // warning: enable at your own risk!
    devTools: false, // update: see the comments in pkmnApi as to why this is disabled

    reducer: {
      [pkmnApi.reducerPath]: pkmnApi.reducer,
      [showdownApi.reducerPath]: showdownApi.reducer,
      [showdexSlice.name]: showdexSlice.reducer,
      [hellodexSlice.name]: hellodexSlice.reducer,
      [notedexSlice.name]: notedexSlice.reducer,
      [calcdexSlice.name]: calcdexSlice.reducer,
      [teamdexSlice.name]: teamdexSlice.reducer,
    },

    // need to disable these default middlewares, otherwise, it'll get wayyy too laggy!
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false,
    }).concat(
      pkmnApi.middleware,
      showdownApi.middleware,
    ),
  });

  // required for refetchOnFocus/refetchOnReconnect
  // update: don't actually care about this feature here, so we'll just not set it up lmao
  // if (typeof store?.dispatch === 'function') {
  //   setupListeners(store.dispatch);
  // }

  l.debug('Created store', store);

  return store;
};
