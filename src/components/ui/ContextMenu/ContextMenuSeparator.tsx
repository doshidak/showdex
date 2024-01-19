import * as React from 'react';
import cx from 'classnames';
import styles from './ContextMenu.module.scss';

export interface ContextMenuSeparatorProps {
  className?: string;
  style?: React.CSSProperties;
}

export const ContextMenuSeparator = ({
  className,
  style,
}: ContextMenuSeparatorProps): JSX.Element => (
  <div
    className={cx(styles.separator, className)}
    style={style}
  />
);
