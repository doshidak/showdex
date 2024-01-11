import * as React from 'react';
import { useTranslation } from 'react-i18next';
import cx from 'classnames';
import { type MoveName } from '@smogon/calc';
import { PokeType } from '@showdex/components/app';
import { type SelectOptionTooltipProps, findCategoryLabel } from '@showdex/components/form';
import { type CalcdexBattleField, type CalcdexPokemon } from '@showdex/interfaces/calc';
import { useCalcdexSettings } from '@showdex/redux/store';
import { formatId } from '@showdex/utils/core';
import { calcHiddenPower, getMoveOverrideDefaults, hasMoveOverrides } from '@showdex/utils/calc';
import { formatDexDescription, getDexForFormat } from '@showdex/utils/dex';
import { type PokemonStatBoostDelta } from '@showdex/utils/ui';
import styles from './PokeMoveOptionTooltip.module.scss';

export interface PokeMoveOptionTooltipProps extends SelectOptionTooltipProps<MoveName> {
  className?: string;
  style?: React.CSSProperties;
  format?: string;
  pokemon?: Partial<CalcdexPokemon>;
  opponentPokemon?: Partial<CalcdexPokemon>;
  field?: CalcdexBattleField;
}

export const PokeMoveOptionTooltip = ({
  className,
  style,
  format,
  pokemon,
  opponentPokemon,
  field,
  label,
  value,
  hidden,
}: PokeMoveOptionTooltipProps): JSX.Element => {
  const { t } = useTranslation('pokedex');
  const settings = useCalcdexSettings();

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

  const hasOverrides = hasMoveOverrides(format, pokemon, value, opponentPokemon, field);
  const moveDefaults = { ...getMoveOverrideDefaults(format, pokemon, value, opponentPokemon, field) };
  const userOverrides = pokemon?.moveOverrides?.[value];
  const moveOverrides = { ...moveDefaults, ...userOverrides };

  const categoryLabel = findCategoryLabel(
    moveOverrides.category === 'Status' ? 'status' : moveOverrides.offensiveStat,
    moveOverrides.defensiveStat,
  );

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

  const basePowerDeltaColor = (
    (basePowerDelta === 'positive' && settings?.nhkoColors?.[0])
      || (basePowerDelta === 'negative' && settings?.nhkoColors?.slice(-1)[0])
  ) || null;

  const showFaintCount = (pokemon?.faintCounter ?? 0) > 0 && (
    formatId(pokemon.dirtyAbility || pokemon.ability) === 'supremeoverlord'
      || formatId(value) === 'lastrespects'
  );

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
      className={cx(styles.container, className)}
      style={style}
    >
      {
        !!description &&
        <div className={styles.description}>
          {description}
        </div>
      }

      {
        hasOverrides &&
        <div
          className={styles.properties}
          style={{ marginBottom: 4 }}
        >
          <div className={styles.property}>
            <div className={styles.propertyName}>
              {t('common:labels.edited')}
            </div>
          </div>
        </div>
      }

      <div className={styles.properties}>
        <PokeType
          className={styles.type}
          type={moveOverrides.type}
          reverseColorScheme
        />

        <div className={styles.property}>
          <div className={styles.propertyName}>
            {t(`categories.${formatId(categoryLabel?.[2])}.1`, '') || (
              <>
                <div className={styles.statLabel}>
                  {t(`stats.${formatId(moveOverrides.offensiveStat)}.1`, moveOverrides.offensiveStat)}
                </div>
                <div className={styles.statVsLabel}>
                  vs
                </div>
                <div className={styles.statLabel}>
                  {t(`stats.${formatId(moveOverrides.defensiveStat)}.1`, moveOverrides.defensiveStat)}
                </div>
              </>
            )}
          </div>

          {/* note: Dex.forGen(1).moves.get('seismictoss').basePower = 1 */}
          {/* lowest BP of a move whose BP isn't dependent on another mechanic should be 10 */}
          {
            basePower > 1 &&
            <div className={styles.propertyValue}>
              {
                !!basePowerDelta &&
                <>
                  <span className={styles.prevValue}>
                    {baseBasePower}
                  </span>
                  <span className={styles.rawr}>
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
                style={basePowerDeltaColor ? { color: basePowerDeltaColor } : undefined}
              >
                {basePower}
              </span>
            </div>
          }

          {
            !categoryLabel?.[2] &&
            <div
              className={styles.propertyName}
              style={{ marginLeft: 4 }}
            >
              {t('stats.bp.1')}
            </div>
          }
        </div>

        {
          showFaintCount &&
          <div className={styles.property}>
            <div className={styles.propertyName}>
              {t('nonvolatiles.fnt.1')}
            </div>

            <div className={styles.propertyValue}>
              {pokemon.faintCounter}
            </div>
          </div>
        }

        {
          showAccuracy &&
          <div className={styles.property}>
            <div className={styles.propertyName}>
              {t('stats.acc.1')}
            </div>

            <div className={styles.propertyValue}>
              {dexMove.accuracy}%
            </div>
          </div>
        }

        {
          showPriority &&
          <div className={styles.property}>
            <div className={styles.propertyName}>
              {t('stats.pri.1')}
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
