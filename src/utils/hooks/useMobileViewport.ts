import * as React from 'react';

/**
 * Detects if the current viewport width is those of mobile devices.
 *
 * @since 1.0.5
 */
export const useMobileViewport = (
  threshold = 576,
): boolean => {
  const [mobile, setMobile] = React.useState(false);

  const { clientWidth = 0 } = document?.documentElement || {};
  const { innerWidth = 0 } = window || {};

  React.useEffect(() => {
    const vw = Math.max(clientWidth || 0, innerWidth || 0);

    setMobile(vw <= threshold);
  }, [
    clientWidth,
    innerWidth,
    threshold,
  ]);

  return mobile;
};
