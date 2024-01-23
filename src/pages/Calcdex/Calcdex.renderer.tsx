import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { Provider as ReduxProvider } from 'react-redux';
import { CalcdexErrorBoundary, CalcdexProvider } from '@showdex/components/calc';
import { ErrorBoundary } from '@showdex/components/debug';
import { SandwichProvider } from '@showdex/components/layout';
import { type RootStore } from '@showdex/redux/store';
import { openHellodexInstance, openHonkdexInstance } from '@showdex/utils/app';
import { HellodexRenderer } from '../Hellodex';
import { HonkdexRenderer } from '../Honkdex';
import { Calcdex } from './Calcdex';

/**
 * Renders the React-based Calcdex interface.
 *
 * * Only required fields are a `dom` created by `ReactDOM.createRoot()`, a `store` containing the
 *   `CalcdexSliceState` & a `battleId` inside the `CalcdexSliceState`.
 *   - You'd typically only provide `battleRoom` for active battles, which primarily contain G-Max
 *     forme data about an auth player's `Showdown.ServerPokemon`.
 * * As of v1.1.5, if you used `createCalcdexRoom()` & provided the optional `rootElement` argument,
 *   you can use the embedded `reactRoot` property for `dom` in the returned `Showdown.HtmlRoom`.
 *   - e.g., If `calcdexRoom` stores the return value of `createCalcdexRoom()`, you can pass in
 *     `calcdexRoom.reactRoot` for the `dom` argument of this function.
 * * Note that this is `export`'d & used by other outside components, like the Hellodex.
 * * Extracted from the Calcdex bootstrapper in v1.2.0.
 *
 * @since 1.0.3
 */
export const CalcdexRenderer = (
  dom: ReactDOM.Root,
  store: RootStore,
  battleId: string,
  battleRoom?: Showdown.BattleRoom,
): void => dom.render((
  <ReduxProvider store={store}>
    <ErrorBoundary
      component={CalcdexErrorBoundary}
      battleId={battleId}
    >
      <SandwichProvider>
        <CalcdexProvider battleId={battleId}>
          <Calcdex
            onRequestHellodex={() => openHellodexInstance(store, HellodexRenderer)}
            onRequestHonkdex={(id) => openHonkdexInstance(store, HonkdexRenderer, id)}
            // note: if we dispatch overlayClosed to false, the battleRoom and the injected Calcdex button
            // won't properly update to reflect the closed state, so we must provide this prop
            onCloseOverlay={() => battleRoom?.toggleCalcdexOverlay?.()}
          />
        </CalcdexProvider>
      </SandwichProvider>
    </ErrorBoundary>
  </ReduxProvider>
));
