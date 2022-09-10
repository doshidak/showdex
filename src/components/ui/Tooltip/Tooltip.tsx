import * as React from 'react';
import Tippy from '@tippyjs/react/headless';
import { animated, useSpring } from '@react-spring/web';
import cx from 'classnames';
import { useColorScheme } from '@showdex/components/app';
import type { TippyProps } from '@tippyjs/react';
import styles from './Tooltip.module.scss';

/* eslint-disable @typescript-eslint/indent -- this rule is broken af. see Issue #1824 in the typescript-eslint GitHub repo. */

export type TooltipTippyProps = Partial<Omit<TippyProps,
  | 'children'
  | 'content'
  | 'ref'
  | 'render'
  | 'singleton'
>>;

/* eslint-enable @typescript-eslint/indent */

export interface TooltipProps extends TooltipTippyProps {
  className?: string;
  style?: React.CSSProperties;
  arrowClassName?: string;
  arrowStyle?: React.CSSProperties;
  content?: React.ReactNode;
  children?: React.ReactElement;
}

const springConfig = {
  mass: 1,
  tension: 250,
  friction: 20,
};

const springProps: Record<string, React.CSSProperties> = {
  show: {
    opacity: 1,
    scale: 1,
  },

  hide: {
    opacity: 0,
    scale: 0.75,
  },
};

export const Tooltip = ({
  className,
  style,
  arrowClassName,
  arrowStyle,
  popperOptions: {
    modifiers: popperModifiers = [],
    ...popperOptions
  } = {},
  content,
  children,
  ...props
}: TooltipProps): JSX.Element => {
  const colorScheme = useColorScheme();

  // animations (required for "headless" Tippy -- i.e., we're not using the default plug-n-play version)
  const [animationStyles, springApi] = useSpring(() => ({
    ...springProps.hide,
    config: springConfig,
  }));

  const handleMount: TippyProps['onMount'] = () => void springApi.start({
    ...springProps.show,
    config: { ...springConfig, clamp: false },
  });

  const handleHide: TippyProps['onHide'] = ({ unmount }) => void springApi.start({
    ...springProps.hide,
    config: { ...springConfig, clamp: true },
    onRest: unmount,
  });

  // custom tooltip arrow
  const [arrow, setArrow] = React.useState<HTMLDivElement>(null);

  return (
    <Tippy
      {...props}
      animation
      popperOptions={{
        ...popperOptions,
        modifiers: [...popperModifiers, {
          name: 'arrow',
          options: { element: arrow },
        }],
      }}
      zIndex={99}
      render={(attributes) => (
        <animated.div
          className={cx(
            styles.container,
            !!colorScheme && styles[colorScheme],
            className,
          )}
          style={{
            ...style,
            ...animationStyles,
          }}
          tabIndex={-1}
          {...attributes}
        >
          {content}

          <div
            ref={setArrow}
            className={cx(
              styles.arrow,
              arrowClassName,
            )}
            style={arrowStyle}
          />
        </animated.div>
      )}
      onMount={handleMount}
      onHide={handleHide}
    >
      {children}
    </Tippy>
  );
};
