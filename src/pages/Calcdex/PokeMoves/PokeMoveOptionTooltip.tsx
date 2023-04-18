import * as React from 'react';
import cx from 'classnames';
import { PokeType } from '@showdex/components/app';
// import { useCalcdexSettings } from '@showdex/redux/store';
// import { formatId } from '@showdex/utils/app';
import { calcHiddenPower } from '@showdex/utils/calc';
import {
  formatDexDescription,
  getDexForFormat,
  getMoveOverrideDefaults,
  hasMoveOverrides,
} from '@showdex/utils/dex';
import type { MoveName } from '@smogon/calc/dist/data/interface';
import type { SelectOptionTooltipProps } from '@showdex/components/form';
import type { CalcdexPokemon } from '@showdex/redux/store';
import type { PokemonStatBoostDelta } from '@showdex/utils/ui';
import styles from './PokeMoves.module.scss';

export interface PokeMoveOptionTooltipProps extends SelectOptionTooltipProps<MoveName> {
  className?: string;
  style?: React.CSSProperties;
  format?: string;
  pokemon?: DeepPartial<CalcdexPokemon>;
  opponentPokemon?: DeepPartial<CalcdexPokemon>;
}

export const PokeMoveOptionTooltip = ({
  className,
  style,
  format,
  pokemon,
  opponentPokemon,
  label,
  value,
  hidden,
}: PokeMoveOptionTooltipProps): JSX.Element => {
  // using label here instead of value since the move can turn into a Z or Max move
  if (!value || hidden) {
    return null;
  }

  const dex = getDexForFormat(format);
  const dexMove = dex?.moves.get(value);

  if (!dexMove?.exists) {
    return null;
  }

  const dexUltMove = pokemon?.useZ || pokemon?.useMax
    ? dex?.moves.get(String(label))
    : null;

  const description = formatDexDescription(
    dexUltMove?.shortDesc
      || dexUltMove?.desc
      || dexMove.shortDesc
      || dexMove.desc,
  );

  // const moveOverrides = {
  //   ...getMoveOverrideDefaults(format, pokemon, value, opponentPokemon),
  //   ...pokemon?.moveOverrides?.[value],
  // };

  const hasOverrides = hasMoveOverrides(format, pokemon, value, opponentPokemon);
  const moveDefaults = { ...getMoveOverrideDefaults(format, pokemon, value, opponentPokemon) };
  const userOverrides = pokemon?.moveOverrides?.[value];
  const moveOverrides = { ...moveDefaults, ...userOverrides };

  // const basePower = (
  //   pokemon?.useZ
  //     ? moveOverrides?.zBasePower
  //     : pokemon?.useMax
  //       ? moveOverrides?.maxBasePower
  //       : null
  // ) || moveOverrides?.basePower;

  const basePowerOverride = (pokemon?.useZ && userOverrides?.zBasePower)
    || (pokemon?.useMax && userOverrides?.maxBasePower)
    || userOverrides?.basePower
    || 0;

  const { basePower: dexBasePower } = dexMove;
  const baseBasePower = dexMove.id.startsWith('hiddenpower')
    ? calcHiddenPower(format, pokemon)
    : dexBasePower;

  const basePower = (pokemon?.useZ && moveOverrides?.zBasePower)
    || (pokemon?.useMax && moveOverrides?.maxBasePower)
    || moveOverrides.basePower
    || dexBasePower
    || 0;

  const basePowerDelta: PokemonStatBoostDelta = (
    !basePowerOverride && (
      (basePower > baseBasePower && 'positive')
        || (basePower < baseBasePower && 'negative')
    )
  ) || null;

  // Z/Max/G-Max moves bypass the original move's accuracy
  // (only time these moves can "miss" is if the opposing Pokemon is in a semi-vulnerable state,
  // after using moves like Fly, Dig, Phantom Force, etc.)
  const showAccuracy = !pokemon?.useMax
    && typeof dexMove.accuracy !== 'boolean'
    && (dexMove.accuracy || 0) > 0
    && dexMove.accuracy !== 100;

  // Z/Max/G-Max moves also don't inherit the original move's priority
  const showPriority = !!dexMove.priority
    && !pokemon?.useZ
    && !pokemon?.useMax;

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

      {
        hasOverrides &&
        <div
          className={styles.moveProperties}
          style={{ marginBottom: 3 }}
        >
          <div className={styles.moveProperty}>
            <div className={styles.propertyName}>
              Edited
            </div>
          </div>
        </div>
      }

      <div className={styles.moveProperties}>
        <PokeType
          className={styles.moveType}
          type={moveOverrides.type}
          reverseColorScheme
        />

        {
          !!moveOverrides.category &&
          <div className={styles.moveProperty}>
            <div className={styles.propertyName}>
              {moveOverrides.category.slice(0, 4)}
            </div>

            {/* note: Dex.forGen(1).moves.get('seismictoss').basePower = 1 */}
            {/* lowest BP of a move whose BP isn't dependent on another mechanic should be 10 */}
            {
              basePower > 1 &&
              <div className={styles.propertyValue}>
                {
                  !!basePowerDelta &&
                  <>
                    <span style={{ opacity: 0.65 }}>
                      {baseBasePower}
                    </span>
                    <span style={{ display: 'inline-block', padding: '0 0.2em', opacity: 0.45 }}>
                      &rarr;
                    </span>
                  </>
                }

                <span
                  className={cx(
                    styles.deltaValue,
                    basePowerDelta === 'positive' && styles.positive,
                    basePowerDelta === 'negative' && styles.negative,
                  )}
                >
                  {basePower}
                </span>
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
          showPriority &&
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
