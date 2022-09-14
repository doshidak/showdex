import { configureStore } from '@reduxjs/toolkit';
// import { setupListeners } from '@reduxjs/toolkit/query/react';
import { logger } from '@showdex/utils/debug';
import type { Action, AnyAction, ConfigureStoreOptions } from '@reduxjs/toolkit';
import { pkmnApi } from '../services';
import { calcdexSlice } from './calcdexSlice';
import { showdexSlice } from './showdexSlice';

export type RootStore = ReturnType<typeof createStore>;
export type RootDispatch = RootStore['dispatch'];

export interface RootState extends ReturnType<RootStore['getState']> {
  calcdex: ReturnType<typeof calcdexSlice.getInitialState>;
}

/**
 * Options for the `createStore()` factory.
 *
 * @since 1.0.0
 */
export type CreateReduxStoreOptions<
  TState = unknown,
  TAction extends Action = AnyAction,
  // TMiddlewares extends Middlewares<TState> = Middlewares<TState>,
> = Omit<Partial<ConfigureStoreOptions<TState, TAction>>, 'middleware' | 'reducer'>;

const l = logger('@showdex/redux/store/createStore');

/**
 * A friendly abstraction for another friendly abstraction, RTK's `configureStore()`.
 *
 * @example
 * ```tsx
 * const store = createStore();
 * const App = ({ Component, pageProps }: AppProps): JSX.Element => (
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

    // devTools: __DEV__,
    devTools: false, // update: see the comments in pkmnApi as to why this is disabled

    reducer: {
      [pkmnApi.reducerPath]: pkmnApi.reducer,
      [showdexSlice.name]: showdexSlice.reducer,
      [calcdexSlice.name]: calcdexSlice.reducer,
    },

    // need to disable these default middlewares, otherwise, it'll get wayyy too laggy!
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false,
    }).concat(
      pkmnApi.middleware,
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
