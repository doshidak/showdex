/**
 * @file `HellodexRenderer.tsx`
 * @author Keith Choison <keith@tize.io>
 * @since 1.0.3
 */

import * as React from 'react';
import type * as ReactDOM from 'react-dom/client';
import { Provider as ReduxProvider } from 'react-redux';
import { SandwichProvider } from '@showdex/components/layout';
import { type RootStore } from '@showdex/redux/store';
import { type HellodexProps, Hellodex } from './Hellodex';

export interface HellodexRendererProps extends HellodexProps {
  store: RootStore;
}

export const HellodexRenderer = ({
  store,
  ...props
}: HellodexRendererProps): React.JSX.Element => (
  <ReduxProvider store={store}>
    <SandwichProvider>
      <Hellodex {...props} />
    </SandwichProvider>
  </ReduxProvider>
);

/**
 * Renders the React-based Hellodex interface.
 *
 * * Extracted from the Hellodex bootstrapper in v1.2.0.
 *
 * @since 1.0.3
 */
export const HellodexDomRenderer = (
  dom: ReactDOM.Root,
  props: HellodexRendererProps,
): void => void dom.render(<HellodexRenderer {...props} />);
