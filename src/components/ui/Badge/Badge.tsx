import * as React from 'react';
import cx from 'classnames';
import styles from './Badge.module.scss';

export interface BadgeInstance {
  show: () => void;
  hide: () => void;
}

export type BadgeColor =
  | 'default'
  | 'red'
  | 'green'
  | 'blue';

export interface BadgeProps {
  className?: string;
  style?: React.CSSProperties;
  label?: string;
  color?: BadgeColor;
  duration?: number;
}

export const Badge = React.forwardRef<BadgeInstance, BadgeProps>(({
  className,
  style,
  label,
  color = 'default',
  duration = 1000,
}: BadgeProps, forwardedRef): JSX.Element => {
  const visibleTimeout = React.useRef<NodeJS.Timeout>(null);
  const [visible, setVisible] = React.useState(false);

  React.useImperativeHandle(forwardedRef, () => ({
    show: () => {
      if (visibleTimeout.current) {
        clearTimeout(visibleTimeout.current);
      }

      setVisible(true);

      if (!duration) {
        return;
      }

      visibleTimeout.current = setTimeout(() => {
        setVisible(false);
        visibleTimeout.current = null;
      }, duration);
    },

    hide: () => {
      if (visibleTimeout.current) {
        clearTimeout(visibleTimeout.current);
      }

      setVisible(false);
      visibleTimeout.current = null;
    },
  }));

  // returned function in the effect function arg is the cleanup function
  React.useEffect(() => () => {
    if (visibleTimeout.current) {
      clearTimeout(visibleTimeout.current);
    }
  }, []);

  return (
    <div
      className={cx(
        styles.container,
        !!color && styles[color],
        visible && styles.visible,
        className,
      )}
      style={style}
    >
      {label}
    </div>
  );
});
