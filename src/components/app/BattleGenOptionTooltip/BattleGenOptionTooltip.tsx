import * as React from 'react';
import cx from 'classnames';
import { romanize } from 'romans';
import { type GenerationNum } from '@smogon/calc';
import { type SelectOptionTooltipProps } from '@showdex/components/form';
import { GenLabels } from '@showdex/consts/dex';
import styles from './BattleGenOptionTooltip.module.scss';

export interface BattleGenOptionTooltipProps extends SelectOptionTooltipProps<GenerationNum> {
  className?: string;
  style?: React.CSSProperties;
}

export const BattleGenOptionTooltip = ({
  className,
  style,
  value,
  hidden,
}: BattleGenOptionTooltipProps): JSX.Element => {
  if (!value || !GenLabels[value || 0]?.description || hidden) {
    return null;
  }

  const { description } = GenLabels[value];

  return (
    <div
      className={cx(styles.container, className)}
      style={style}
    >
      <strong>Gen {romanize(value)}</strong>
      <br />
      {description || 'No description available.'}
    </div>
  );
};
