/**
 * @file `CalcdexRenderer.tsx`
 * @author Keith Choison <keith@tize.io>
 * @since 1.0.3
 */

import * as React from 'react';
import type * as ReactDOM from 'react-dom/client';
import { Provider as ReduxProvider } from 'react-redux';
import { CalcdexErrorBoundary, CalcdexProvider } from '@showdex/components/calc';
import { ErrorBoundary } from '@showdex/components/debug';
import { SandwichProvider } from '@showdex/components/layout';
import { type RootStore } from '@showdex/redux/store';
import { type CalcdexProps, Calcdex } from './Calcdex';

export interface CalcdexRendererProps extends CalcdexProps {
  store: RootStore;
  battleId: string;
}

export const CalcdexRenderer = ({
  store,
  battleId,
  ...props
}: CalcdexRendererProps): React.JSX.Element => (
  <ReduxProvider store={store}>
    <ErrorBoundary
      component={CalcdexErrorBoundary}
      battleId={battleId}
    >
      <SandwichProvider>
        <CalcdexProvider battleId={battleId}>
          <Calcdex {...props} />
        </CalcdexProvider>
      </SandwichProvider>
    </ErrorBoundary>
  </ReduxProvider>
);

/**
 * Renders the React-based Calcdex interface.
 *
 * * Only required fields are a `dom` created by `ReactDOM.createRoot()`, the `props.store` containing the `CalcdexSliceState`
 *   & a `props.battleId`, typically from the `CalcdexSliceState`.
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
export const CalcdexDomRenderer = (
  dom: ReactDOM.Root,
  props: CalcdexRendererProps,
): void => void dom.render(<CalcdexRenderer {...props} />);
