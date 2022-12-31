import * as React from 'react';
import cx from 'classnames';
import { PokemonTypeLabels } from '@showdex/consts/pokemon';
import { useColorScheme } from '@showdex/redux/store';
import type { ElementSizeLabel } from '@showdex/utils/hooks';
import styles from './PokeType.module.scss';

export interface PokeTypeProps {
  className?: string;
  style?: React.CSSProperties;
  type?: Showdown.TypeName;
  defaultLabel?: string;
  reverseColorScheme?: boolean;
  containerSize?: ElementSizeLabel;
  highlight?: boolean;
}

export const PokeType = ({
  className,
  style,
  type,
  defaultLabel,
  reverseColorScheme,
  containerSize,
  highlight = true,
}: PokeTypeProps): JSX.Element => {
  const currentColorScheme = useColorScheme();

  const colorScheme = (!reverseColorScheme && currentColorScheme)
    || (reverseColorScheme && currentColorScheme === 'light' && 'dark')
    || (reverseColorScheme && currentColorScheme === 'dark' && 'light')
    || null;

  const shouldAbbreviate = ['xs', 'sm'].includes(containerSize);

  // using `null` instead of `-1` to keep TypeScript happy
  // (even if you say `labelIndex > -1`, TypeScript can't infer that labelIndex must be 0, 1, or 2)
  const labelIndex = type && type !== '???' && type in PokemonTypeLabels
    ? shouldAbbreviate
      ? containerSize === 'sm' ? 1 : 2
      : 0
    : null;

  // TypeScript also can't infer that we've previously checked `type !== '???'` in labelIndex
  // (otherwise it would be `null`), so we gotta check again to keep it happy
  const label = (
    typeof labelIndex === 'number'
      && type !== '???' // this is also necessary for TypeScript lol
      && PokemonTypeLabels[type]?.[labelIndex]
  ) || defaultLabel || '???';

  return (
    <span
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        // (!type || type === '???') && styles['type-unknown'],
        !!type && type !== '???' && styles[`type-${type.toLowerCase()}`],
        shouldAbbreviate && styles[containerSize],
        highlight && styles.highlight,
        className,
      )}
      style={style}
    >
      {label}
    </span>
  );
};
