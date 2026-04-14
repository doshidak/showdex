import * as React from 'react';
import { type TippyProps } from '@tippyjs/react';
import Tippy from '@tippyjs/react/headless';
import { animated, useSpring } from '@react-spring/web';
import cx from 'classnames';
import { useColorScheme } from '@showdex/redux/store';
// import { LazyTippy } from './LazyTippy';
import styles from './Tooltip.module.scss';

export type TooltipTippyProps = Partial<Omit<TippyProps,
  | 'children'
  | 'content'
  | 'ref'
  | 'render'
  | 'singleton'
>>;

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

const AnimatedDiv = animated.div;

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
}: TooltipProps): React.JSX.Element => {
  const colorScheme = useColorScheme();

  // animations (required for "headless" Tippy -- i.e., we're not using the default plug-n-play version)
  const [animationStyles, springApi] = useSpring(() => ({
    ...springProps.hide,
    config: springConfig,
  }));

  const handleMount: TippyProps['onMount'] = (instance) => {
    onMount?.(instance);

    void springApi.start({
      ...springProps.show,
      config: { ...springConfig, clamp: false },
      onRest: () => {},
    });
  };

  const handleHide: TippyProps['onHide'] = (instance) => void springApi.start({
    ...springProps.hide,
    config: { ...springConfig, clamp: true },
    onRest: ({ cancelled }) => void (cancelled ? 0 : instance?.unmount()),
  });

  const handleHidden: TippyProps['onHidden'] = (instance) => {
    springApi.set(springProps.hide);
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
        <AnimatedDiv
          className={cx(
            styles.container,
            !!colorScheme && styles[colorScheme],
            className,
          )}
          style={{
            ...style,
            ...animationStyles,
            ...(derender && { display: 'none' }),
          }}
          tabIndex={-1}
          {...attributes}
        >
          {renderContent || content}

          <div
            ref={setArrow}
            className={cx(
              styles.arrow,
              arrowClassName,
            )}
            style={arrowStyle}
          />
        </AnimatedDiv>
      )}
      onMount={handleMount}
      onHide={handleHide}
      onHidden={handleHidden}
    >
      {children}
    </Tippy>
  );
};
