import * as React from 'react';
import { type TippyProps } from '@tippyjs/react';
import Tippy from '@tippyjs/react/headless';
import { animated, useSpring } from '@react-spring/web';
import cx from 'classnames';
import { useColorScheme } from '@showdex/redux/store';
// import { LazyTippy } from './LazyTippy';
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

export type TooltipTippyTrigger =
  | 'click'
  | 'focus'
  | 'focusin'
  | 'manual'
  | 'mouseenter';

export interface TooltipProps extends Omit<TooltipTippyProps, 'trigger'> {
  className?: string;
  style?: React.CSSProperties;
  arrowClassName?: string;
  arrowStyle?: React.CSSProperties;
  content?: React.ReactNode;
  trigger?: TooltipTippyTrigger | TooltipTippyTrigger[];
  derender?: boolean;
  children?: React.ReactElement;
}

const springConfig = {
  mass: 1,
  tension: 300,
  friction: 27,
};

const springProps: Record<string, React.CSSProperties> = {
  show: {
    opacity: 1,
    scale: 1,
  },

  hide: {
    opacity: 0,
    scale: 0.9,
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
  trigger,
  derender,
  onMount,
  onHidden,
  children,
  ...props
}: TooltipProps): JSX.Element => {
  const colorScheme = useColorScheme();

  // animations (required for "headless" Tippy -- i.e., we're not using the default plug-n-play version)
  const [animationStyles, springApi] = useSpring(() => ({
    ...springProps.hide,
    config: springConfig,
  }));

  // keep track of the mounted state
  const [mounted, setMounted] = React.useState(false);

  const handleMount: TippyProps['onMount'] = (instance) => {
    setMounted(true);
    onMount?.(instance);

    void springApi.start({
      ...springProps.show,
      config: { ...springConfig, clamp: false },
    });
  };

  const handleHide: TippyProps['onHide'] = ({ unmount }) => {
    void springApi.start({
      ...springProps.hide,
      config: { ...springConfig, clamp: true },
      onRest: unmount,
    });
  };

  const handleHidden: TippyProps['onHidden'] = (instance) => {
    setMounted(false);
    onHidden?.(instance);
  };

  // custom tooltip arrow
  const [arrow, setArrow] = React.useState<HTMLDivElement>(null);

  return (
    <Tippy
      {...props}
      animation
      popperOptions={{
        strategy: 'fixed',
        ...popperOptions,
        modifiers: [...popperModifiers, {
          name: 'arrow',
          options: {
            element: arrow,
            // padding: 15,
          },
        }].filter(Boolean),
      }}
      trigger={Array.isArray(trigger) ? trigger.join(' ') : trigger}
      zIndex={99}
      render={(
        attributes,
        renderContent,
      ) => (
        <animated.div
          className={cx(
            styles.container,
            !!colorScheme && styles[colorScheme],
            className,
          )}
          style={{
            ...style,
            ...animationStyles,
            ...((!mounted || derender) && { display: 'none' }),
          }}
          tabIndex={-1}
          {...attributes}
        >
          {mounted && (renderContent || content)}

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
      onHidden={handleHidden}
    >
      {children}
    </Tippy>
  );
};
