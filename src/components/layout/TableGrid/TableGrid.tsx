import * as React from 'react';
import cx from 'classnames';
import styles from './TableGrid.module.scss';

export interface TableGridProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const TableGrid = ({
  className,
  style,
  children,
}: TableGridProps): JSX.Element => (
  <div
    className={cx(styles.container, className)}
    style={style}
  >
    {children}
  </div>
);
