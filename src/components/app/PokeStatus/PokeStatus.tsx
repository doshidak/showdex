import * as React from 'react';
import { useTranslation } from 'react-i18next';
import cx from 'classnames';
import { PokemonStatuses } from '@showdex/consts/dex';
import { useColorScheme } from '@showdex/redux/store';
import { formatId } from '@showdex/utils/core';
import { type ElementSizeLabel } from '@showdex/utils/hooks';
import { determineColorScheme } from '@showdex/utils/ui';
import styles from './PokeStatus.module.scss';

export interface PokeStatusProps {
  className?: string;
  style?: React.CSSProperties;
  labelClassName?: string;
  labelStyle?: React.CSSProperties;
  status?: Showdown.PokemonStatus | '';
  override?: string;
  defaultLabel?: string;
  fainted?: boolean;
  reverseColorScheme?: boolean;
  containerSize?: ElementSizeLabel;
  highlight?: boolean;
}

export const PokeStatus = ({
  className,
  style,
  labelClassName,
  labelStyle,
  status,
  override,
  defaultLabel,
  fainted,
  reverseColorScheme,
  containerSize,
  highlight = true,
}: PokeStatusProps): JSX.Element => {
  const { t } = useTranslation('pokedex');
  const currentColorScheme = useColorScheme();
  const colorScheme = determineColorScheme(currentColorScheme, reverseColorScheme);

  if (!PokemonStatuses.includes(status as Showdown.PokemonStatus) && !fainted && !override) {
    return null;
  }

  const labelIndex = ['xs', 'sm'].includes(containerSize) ? 1 : 0;

  const label = (fainted && 'RIP') || override || (
    status !== '???'
      && t(`nonvolatiles.${formatId(status)}.${labelIndex + 1}`, status)
  ) || defaultLabel || '???';

  return (
    <span
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        !fainted && !override && styles[`status-${status.toLowerCase()}`],
        fainted && styles['status-fnt'],
        highlight && styles.highlight,
        labelIndex === 1 && styles.smol,
        className,
      )}
      style={style}
    >
      <span
        className={cx(styles.label, labelClassName)}
        style={labelStyle}
      >
        {label}
      </span>
    </span>
  );
};
