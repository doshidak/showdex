import * as React from 'react';
import { type SeparatorProps } from 'react-contexify';
import cx from 'classnames';
import styles from './ContextMenu.module.scss';

export interface ContextMenuSeparatorProps extends SeparatorProps {
  className?: string;
  style?: React.CSSProperties;
}

export const ContextMenuSeparator = ({
  className,
  style,
  hidden,
}: ContextMenuSeparatorProps): JSX.Element => (hidden ? null : (
  <div
    className={cx(styles.separator, className)}
    style={style}
  />
));
