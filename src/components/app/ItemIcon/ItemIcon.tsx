import * as React from 'react';
import { type ItemName } from '@smogon/calc';
import cx from 'classnames';
import styles from './ItemIcon.module.scss';

export interface ItemIconProps {
  className?: string;
  style?: React.CSSProperties;
  item: ItemName;
}

export const ItemIcon = ({
  className,
  style,
  item,
}: ItemIconProps): JSX.Element => {
  const css = item ? Dex?.getItemIcon(item) : null;
  const background = css?.replace(/^background:/, '');

  return (
    <div
      className={cx(styles.container, className)}
      style={{
        ...style,
        ...(!!background && { background }),
      }}
    />
  );
};
