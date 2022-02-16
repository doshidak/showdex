import * as React from 'react';
import cx from 'classnames';
import styles from './PokeStatus.module.scss';

export interface PokeStatusProps {
  className?: string;
  style?: React.CSSProperties;
  status?: Showdown.PokemonStatus | '';
  fainted?: boolean;
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
  fainted,
}: PokeStatusProps): JSX.Element => (fainted || Object.keys(abbrevs).includes(status) ? (
  <span
    className={cx(
      styles.container,
      !fainted && styles[status],
      fainted && styles.fnt,
      className,
    )}
    style={style}
  >
    {fainted ? 'RIP' : abbrevs[status]}
  </span>
) : null);
