import * as React from 'react';
import cx from 'classnames';
import styles from './PokeStatus.module.scss';

export interface PokeStatusProps {
  className?: string;
  style?: React.CSSProperties;
  status?: Showdown.PokemonStatus;
}

const abbrevs: Record<Showdown.PokemonStatus, string> = {
  brn: 'BRN',
  frz: 'FRZ',
  par: 'PAR',
  slp: 'SLP',
  tox: 'TOX',
  '???': '???',
};

export const PokeStatus = ({
  className,
  style,
  status,
}: PokeStatusProps): JSX.Element => (Object.keys(abbrevs).includes(status) ? (
  <span
    className={cx(
      styles.container,
      styles[status],
      className,
    )}
    style={style}
  >
    {abbrevs[status]}
  </span>
) : null);
