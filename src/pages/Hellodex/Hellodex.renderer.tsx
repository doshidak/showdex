import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { Provider as ReduxProvider } from 'react-redux';
import { SandwichProvider } from '@showdex/components/layout';
import { type RootStore } from '@showdex/redux/store';
import { openCalcdexInstance, openHonkdexInstance, removeHonkdexInstances } from '@showdex/utils/app';
import { CalcdexRenderer } from '../Calcdex';
import { HonkdexRenderer } from '../Honkdex';
import { Hellodex } from './Hellodex';

/**
 * Renders the React-based Hellodex interface.
 *
 * * Extracted from the Hellodex bootstrapper in v1.2.0.
 *
 * @since 1.0.3
 */
export const HellodexRenderer = (
  dom: ReactDOM.Root,
  store: RootStore,
): void => dom.render((
  <ReduxProvider store={store}>
    <SandwichProvider>
      <Hellodex
        openCalcdexInstance={(battleId) => openCalcdexInstance(
          store,
          CalcdexRenderer,
          battleId,
        )}
        openHonkdexInstance={(instanceId) => openHonkdexInstance(
          store,
          HonkdexRenderer,
          instanceId,
        )}
        removeHonkdexInstances={(...instanceIds) => removeHonkdexInstances(
          store,
          instanceIds,
        )}
      />
    </SandwichProvider>
  </ReduxProvider>
));
