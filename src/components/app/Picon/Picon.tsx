import * as React from 'react';
import cx from 'classnames';
import styles from './Picon.module.scss';

export interface PiconProps {
  className?: string;
  style?: React.CSSProperties;
  pokemon?: Partial<Showdown.Pokemon> | string;
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

  let [iconCss] = pokemon ? (Dex.getPokemonIcon(pokemon, facingLeft) || '').split(';') : [];

  if (!iconCss) {
    iconCss = Dex.getPokemonIcon('pokeball-none', facingLeft).split(';')?.[0];
  }

  if (iconCss?.startsWith?.(iconCssPrefix)) {
    iconCss = iconCss.slice(iconCssPrefix.length);
  }

  let itemIconCss = typeof pokemon !== 'string' && pokemon?.item ? Dex.getItemIcon(pokemon.item) : null;

  if (itemIconCss?.startsWith?.(iconCssPrefix)) {
    itemIconCss = itemIconCss.slice(iconCssPrefix.length);
  }

  return (
    <div
      className={cx(styles.container, className)}
      style={{ ...style, background: iconCss }}
    >
      {
        !!itemIconCss &&
        <div
          className={styles.itemIcon}
          style={{ background: itemIconCss }}
        />
      }
    </div>
  );
};
