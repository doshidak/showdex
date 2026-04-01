/**
 * @file `HonkdexRenderer.tsx`
 * @author Keith Choison <keith@tize.io>
 * @since 1.2.0
 */

import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { Provider as ReduxProvider } from 'react-redux';
import { CalcdexErrorBoundary, CalcdexProvider } from '@showdex/components/calc';
import { ErrorBoundary } from '@showdex/components/debug';
import { SandwichProvider } from '@showdex/components/layout';
import { type RootStore } from '@showdex/redux/store';
import { type HonkdexProps, Honkdex } from './Honkdex';

export interface HonkdexRendererProps extends HonkdexProps {
  store: RootStore;
  instanceId: string;
}

export const HonkdexRenderer = ({
  store,
  instanceId,
  ...props
}: HonkdexRendererProps): React.JSX.Element => (
  <ReduxProvider store={store}>
    <ErrorBoundary
      component={CalcdexErrorBoundary}
      battleId={instanceId}
    >
      <SandwichProvider>
        <CalcdexProvider battleId={instanceId}>
          <Honkdex {...props} />
        </CalcdexProvider>
      </SandwichProvider>
    </ErrorBoundary>
  </ReduxProvider>
);

/**
 * Renders the React-based Honkdex interface.
 *
 * @since 1.2.0
 */
export const HonkdexDomRenderer = (
  dom: ReactDOM.Root,
  props: HonkdexRendererProps,
): void => dom.render(<HonkdexRenderer {...props} />);
