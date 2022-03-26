import * as React from 'react';
import cx from 'classnames';
import { useColorScheme } from '@showdex/components/app';
import styles from './TableGrid.module.scss';

export interface TableGridItemProps {
  className?: string;
  style?: React.CSSProperties;
  align?: 'left' | 'center' | 'right';
  header?: boolean;
  small?: boolean;
  children?: React.ReactNode;
}

export const TableGridItem = ({
  className,
  style,
  align = 'center',
  header,
  small,
  children,
}: TableGridItemProps): JSX.Element => {
  const colorScheme = useColorScheme();

  return (
    <div
      className={cx(
        styles.item,
        !!colorScheme && styles[colorScheme],
        align !== 'center' && styles[align],
        header && styles.header,
        small && styles.small,
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
};
