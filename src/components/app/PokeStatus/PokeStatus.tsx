import * as React from 'react';
import cx from 'classnames';
import { useColorScheme } from '@showdex/redux/store';
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
  psn: 'PSN',
  slp: 'SLP',
  tox: 'TOX', // badly poisoned
  '???': '???',
};

export const PokeStatus = ({
  className,
  style,
  status,
  fainted,
}: PokeStatusProps): JSX.Element => {
  const colorScheme = useColorScheme();

  return (fainted || Object.keys(abbrevs).includes(status) ? (
    <span
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        !fainted && styles[status],
        fainted && styles.fnt,
        className,
      )}
      style={style}
    >
      {fainted ? 'RIP' : abbrevs[status]}
    </span>
  ) : null);
};
