import * as React from 'react';
import cx from 'classnames';
import { type ItemName } from '@smogon/calc';
import { type CalcdexPokemon } from '@showdex/interfaces/calc';
import { ItemIcon } from '../ItemIcon';
import styles from './Picon.module.scss';

export interface PiconProps {
  className?: string;
  style?: React.CSSProperties;
  pokemon?: Partial<Showdown.Pokemon> | Partial<CalcdexPokemon> | string;
  facingLeft?: boolean;
}

export const Picon = ({
  className,
  style,
  pokemon,
  facingLeft,
}: PiconProps): JSX.Element => {
  const css = Dex?.getPokemonIcon(pokemon || 'pokeball-none', facingLeft).split(';')[0];
  const background = css?.replace(/^background:/, '');

  const item = (typeof pokemon !== 'string' && pokemon?.item as ItemName) || null;

  return (
    <div
      className={cx(styles.container, className)}
      style={{
        ...style,
        ...(!!background && { background }),
      }}
    >
      {
        !!item &&
        <ItemIcon
          className={styles.itemIcon}
          item={item}
        />
      }
    </div>
  );
};
