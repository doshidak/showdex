/**
 * @file `NotedexRenderer.tsx`
 * @author Keith Choison <keith@tize.io>
 * @since 1.3.0
 */

import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { Provider as ReduxProvider } from 'react-redux';
import { SandwichProvider } from '@showdex/components/layout';
import { type RootStore } from '@showdex/redux/store';
import { type NotedexProps, Notedex } from './Notedex';

export interface NotedexRendererProps extends NotedexProps {
  store: RootStore;
  instanceId: string;
}

export const NotedexRenderer = ({
  store,
  instanceId,
  ...props
}: NotedexRendererProps): React.JSX.Element => (
  <ReduxProvider store={store}>
    <SandwichProvider>
      <Notedex {...props} instanceId={instanceId} />
    </SandwichProvider>
  </ReduxProvider>
);

/**
 * Renders the React-based Notedex interface.
 *
 * @since 1.3.0
 */
export const NotedexDomRenderer = (
  dom: ReactDOM.Root,
  props: NotedexRendererProps,
): void => void dom.render(<NotedexRenderer {...props} />);
