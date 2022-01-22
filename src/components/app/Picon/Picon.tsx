import * as React from 'react';
import cx from 'classnames';
import styles from './Picon.module.scss';

interface PiconProps {
  className?: string;
  style?: React.CSSProperties;
  pokemon?: Parameters<Showdown.Dex['getPokemonIcon']>[0];
  facingLeft?: boolean;
}

const iconCssPrefix = 'background:';

export const Picon = ({
  className,
  style,
  pokemon,
  facingLeft,
}: PiconProps): JSX.Element => {
  /** @todo replace all `null`'s with the empty icon */
  if (typeof Dex?.getPokemonIcon !== 'function') {
    return null;
  }

  let iconCss = (Dex.getPokemonIcon(pokemon, facingLeft) || '').split(';');

  if (!iconCss.length) {
    iconCss = Dex.getPokemonIcon('pokeball-none', facingLeft).split(';');
  }

  if (iconCss[0].startsWith(iconCssPrefix)) {
    iconCss[0] = iconCss[0].slice(iconCssPrefix.length);
  }

  return (
    <div
      className={cx(styles.container, className)}
      style={{ ...style, background: iconCss[0] }}
    />
  );
};
