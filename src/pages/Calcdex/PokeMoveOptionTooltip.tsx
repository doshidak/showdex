import * as React from 'react';
import cx from 'classnames';
import { PokeType } from '@showdex/components/app';
// import { useCalcdexSettings } from '@showdex/redux/store';
import { formatId } from '@showdex/utils/app';
import { formatDexDescription, getDexForFormat } from '@showdex/utils/battle';
import { calcHiddenPower } from '@showdex/utils/calc';
import type { MoveName } from '@smogon/calc/dist/data/interface';
import type { SelectOptionTooltipProps } from '@showdex/components/form';
import type { CalcdexPokemon } from '@showdex/redux/store';
import styles from './PokeMoves.module.scss';

export interface PokeMoveOptionTooltipProps extends SelectOptionTooltipProps<MoveName> {
  className?: string;
  style?: React.CSSProperties;
  format?: string;
  pokemon?: DeepPartial<CalcdexPokemon>;
}

export const PokeMoveOptionTooltip = ({
  className,
  style,
  format,
  pokemon,
  label,
  hidden,
}: PokeMoveOptionTooltipProps): JSX.Element => {
  // using label here instead of value since the move can turn into a Z or Max move
  if (!label || hidden) {
    return null;
  }

  const dex = getDexForFormat(format);
  const dexMove = dex?.moves.get(label);

  if (!dexMove?.type) {
    return null;
  }

  const basePower = formatId(label).includes('hiddenpower')
    ? calcHiddenPower(format, pokemon)
    : dexMove?.basePower || 0;

  const description = formatDexDescription(dexMove.shortDesc || dexMove.desc);

  // Z/Max/G-Max moves bypass the original move's accuracy
  // (only time these moves can "miss" is if the opposing Pokemon is in a semi-vulnerable state,
  // after using moves like Fly, Dig, Phantom Force, etc.)
  const showAccuracy = !pokemon?.useMax
    && typeof dexMove.accuracy !== 'boolean'
    && (dexMove.accuracy || -1) > 0
    && dexMove.accuracy !== 100;

  return (
    <div
      className={cx(
        styles.moveTooltip,
        className,
      )}
      style={style}
    >
      {
        !!description &&
        <div className={styles.moveDescription}>
          {description}
        </div>
      }

      <div className={styles.moveProperties}>
        <PokeType
          className={styles.moveType}
          type={dexMove.type}
          reverseColorScheme
        />

        {
          !!dexMove.category &&
          <div className={styles.moveProperty}>
            <div className={styles.propertyName}>
              {dexMove.category.slice(0, 4)}
            </div>

            {/* note: Dex.forGen(1).moves.get('seismictoss').basePower = 1 */}
            {/* lowest BP of a move whose BP isn't dependent on another mechanic should be 10 */}
            {
              basePower > 2 &&
              <div className={styles.propertyValue}>
                {basePower}
              </div>
            }
          </div>
        }

        {
          showAccuracy &&
          <div className={styles.moveProperty}>
            <div className={styles.propertyName}>
              ACC
            </div>

            <div className={styles.propertyValue}>
              {dexMove.accuracy}%
            </div>
          </div>
        }

        {
          !!dexMove.priority &&
          <div className={styles.moveProperty}>
            <div className={styles.propertyName}>
              PRI
            </div>

            <div className={styles.propertyValue}>
              {dexMove.priority > 0 && '+'}
              {dexMove.priority}
            </div>
          </div>
        }
      </div>
    </div>
  );
};
