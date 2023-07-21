import * as React from 'react';
import { type TippyProps } from '@tippyjs/react';
import Tippy from '@tippyjs/react/headless';

/**
 * Will only render the `content` or `render` elements if the Tippy is mounted to the DOM.
 *
 * * Replace `Tippy` with `LazyTippy` and it should work the same.
 *
 * @deprecated As of v1.0.3, `mounted` was directly implemented into `Tooltip`, so not being used atm.
 * @see https://gist.github.com/atomiks/520f4b0c7b537202a23a3059d4eec908
 * @since 1.0.3
 */
export const LazyTippy = React.forwardRef<Element, TippyProps>(({
  plugins,
  content,
  render,
  ...props
}: TippyProps, forwardedRef): JSX.Element => {
  const [mounted, setMounted] = React.useState(false);

  const lazyPlugin = {
    fn: () => ({
      onMount: () => setMounted(true),
      onHidden: () => setMounted(false),
    }),
  };

  return (
    <Tippy
      ref={forwardedRef}
      {...props}
      plugins={[
        lazyPlugin,
        ...(plugins || []),
      ]}
      content={typeof render !== 'function' && mounted ? content : null}
      render={typeof render === 'function' ? (...args) => (
        mounted ? render(...args) : null
      ) : null}
    />
  );
});
