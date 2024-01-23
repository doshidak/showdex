import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { Provider as ReduxProvider } from 'react-redux';
import { CalcdexErrorBoundary, CalcdexProvider } from '@showdex/components/calc';
import { ErrorBoundary } from '@showdex/components/debug';
import { SandwichProvider } from '@showdex/components/layout';
import { type RootStore } from '@showdex/redux/store';
import { openHellodexInstance, openHonkdexInstance } from '@showdex/utils/app';
import { HellodexRenderer } from '../Hellodex';
import { Honkdex } from './Honkdex';

/**
 * Renders the React-based Honkdex interface.
 *
 * @since 1.2.0
 */
export const HonkdexRenderer = (
  dom: ReactDOM.Root,
  store: RootStore,
  instanceId: string,
): void => dom.render((
  <ReduxProvider store={store}>
    <ErrorBoundary
      component={CalcdexErrorBoundary}
      battleId={instanceId}
    >
      <SandwichProvider>
        <CalcdexProvider battleId={instanceId}>
          <Honkdex
            onRequestHellodex={() => openHellodexInstance(store, HellodexRenderer)}
            // *inception_horn.wav*
            onRequestHonkdex={(id, initState) => openHonkdexInstance(store, HonkdexRenderer, id, initState)}
          />
        </CalcdexProvider>
      </SandwichProvider>
    </ErrorBoundary>
  </ReduxProvider>
));
