import * as React from 'react';
import cx from 'classnames';
import styles from './CopiedBadge.module.scss';

export interface CopiedBadgeInstance {
  show: () => void;
  hide: () => void;
}

export interface CopiedBadgeProps {
  className?: string;
  style?: React.CSSProperties;
  label?: string;
  duration?: number;
}

export const CopiedBadge = React.forwardRef<CopiedBadgeInstance, CopiedBadgeProps>(({
  className,
  style,
  label = 'Copied!',
  duration = 1000,
}: CopiedBadgeProps, forwardedRef): JSX.Element => {
  const visibleTimeout = React.useRef<NodeJS.Timeout>(null);
  const [visible, setVisible] = React.useState(false);

  React.useImperativeHandle(forwardedRef, () => ({
    show: () => {
      if (visibleTimeout.current) {
        clearTimeout(visibleTimeout.current);
      }

      setVisible(true);

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
        visible && styles.visible,
        className,
      )}
      style={style}
    >
      {label}
    </div>
  );
});
