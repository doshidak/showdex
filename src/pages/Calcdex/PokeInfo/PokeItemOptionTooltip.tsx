import * as React from 'react';
import cx from 'classnames';
import { type ItemName } from '@smogon/calc';
import { type SelectOptionTooltipProps } from '@showdex/components/form';
import { formatDexDescription, getDexForFormat } from '@showdex/utils/dex';
import styles from './PokeInfo.module.scss';

export interface PokeItemOptionTooltipProps extends SelectOptionTooltipProps<ItemName> {
  className?: string;
  style?: React.CSSProperties;
  format?: string;
}

export const PokeItemOptionTooltip = ({
  className,
  style,
  format,
  value,
  hidden,
}: PokeItemOptionTooltipProps): JSX.Element => {
  if (!value || hidden) {
    return null;
  }

  const dex = getDexForFormat(format);
  const dexItem = dex?.items.get(value);
  const description = formatDexDescription(dexItem?.shortDesc || dexItem?.desc);

  return (
    <div
      className={cx(
        styles.tooltipContent,
        styles.descTooltip,
        className,
      )}
      style={style}
    >
      {description || 'No description available.'}
    </div>
  );
};
