import * as React from 'react';
import { useTranslation } from 'react-i18next';
import cx from 'classnames';
import { PokemonTypeLabels } from '@showdex/consts/dex';
import { useColorScheme } from '@showdex/redux/store';
import { formatId } from '@showdex/utils/core';
import { type ElementSizeLabel } from '@showdex/utils/hooks';
import { determineColorScheme } from '@showdex/utils/ui';
import styles from './PokeType.module.scss';

export interface PokeTypeProps {
  className?: string;
  style?: React.CSSProperties;
  labelClassName?: string;
  labelStyle?: React.CSSProperties;
  type?: Showdown.TypeName;
  override?: string;
  defaultLabel?: string;
  teraTyping?: boolean;
  reverseColorScheme?: boolean;
  containerSize?: ElementSizeLabel;
  highlight?: boolean;
}

export const PokeType = ({
  className,
  style,
  labelClassName,
  labelStyle,
  override,
  type,
  defaultLabel,
  highlight = true,
  reverseColorScheme,
  containerSize,
  teraTyping,
}: PokeTypeProps): JSX.Element => {
  const { t } = useTranslation('pokedex');
  const currentColorScheme = useColorScheme();
  const colorScheme = determineColorScheme(currentColorScheme, reverseColorScheme);

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
  const label = override || (
    typeof labelIndex === 'number'
      && type !== '???' // this is also necessary for TypeScript lol
      && t(
        `types.${formatId(type)}.${labelIndex + 1}`,
        PokemonTypeLabels[type]?.[labelIndex],
      )
  ) || defaultLabel || '???';

  return (
    <span
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        !!type && type !== '???' && styles[`type-${type.toLowerCase()}`],
        shouldAbbreviate && styles[containerSize],
        highlight && styles.highlight,
        teraTyping && styles.teraTyping,
        className,
      )}
      style={style}
    >
      <span
        className={cx(styles.label, labelClassName)}
        style={labelStyle}
      >
        <span>{label}</span>
      </span>

      {
        teraTyping &&
        <>
          {/* &nbsp; */}
          <span className={cx(styles.teraEdge, styles.topLeft)} />
          <span className={cx(styles.teraEdge, styles.topRight)} />
          <span className={cx(styles.teraEdge, styles.middleRight)} />
          <span className={cx(styles.teraEdge, styles.bottomRight)} />
          <span className={cx(styles.teraEdge, styles.bottomLeft)} />
          <span className={cx(styles.teraEdge, styles.middleLeft)} />
        </>
      }
    </span>
  );
};
