import * as React from 'react';
import cx from 'classnames';
import { Button } from '@showdex/components/ui';
// import type { State } from '@smogon/calc';
import type { CalcdexBattleField } from './CalcdexReducer';
import styles from './PokeCalc.module.scss';

interface FieldCalcProps {
  className?: string;
  style?: React.CSSProperties;
  field?: CalcdexBattleField;
  onFieldChange?: (field: Partial<CalcdexBattleField>) => void;
}

export const FieldCalc = ({
  className,
  style,
  field,
  onFieldChange,
}: FieldCalcProps): JSX.Element => {
  const {
    weather,
    terrain,
    attackerSide,
    defenderSide,
  } = field || {};

  return (
    <div
      className={cx(className)}
      style={style}
    >
      <div className={cx(styles.tableGrid, styles.stageTable)}>
        <div className={cx(styles.tableItem, styles.statLabel, styles.left)}>
          Your Screens
        </div>
        <div className={cx(styles.tableItem, styles.statLabel)}>
          Weather
        </div>
        <div className={cx(styles.tableItem, styles.statLabel)}>
          Terrain
        </div>
        <div className={cx(styles.tableItem, styles.statLabel, styles.right)}>
          Their Screens
        </div>

        <div className={cx(styles.tableItem, styles.left)}>
          {/* {p1SideConditions.length ? p1SideConditions.flatMap((c) => c?.[0]).join(' / ') : 'None'} */}
          <Button
            labelStyle={attackerSide?.isLightScreen ? undefined : { color: '#FFFFFF' }}
            label="Light"
            onPress={() => onFieldChange?.({
              // ...field,
              attackerSide: {
                ...attackerSide,
                isLightScreen: !attackerSide?.isLightScreen,
              },
            })}
          />
          {' '}
          <Button
            labelStyle={attackerSide?.isReflect ? undefined : { color: '#FFFFFF' }}
            label="Reflect"
            onPress={() => onFieldChange?.({
              // ...field,
              attackerSide: {
                ...attackerSide,
                isReflect: !attackerSide?.isReflect,
              },
            })}
          />
          {' '}
          <Button
            labelStyle={attackerSide?.isAuroraVeil ? undefined : { color: '#FFFFFF' }}
            label="Aurora"
            onPress={() => onFieldChange?.({
              // ...field,
              attackerSide: {
                ...attackerSide,
                isAuroraVeil: !attackerSide?.isAuroraVeil,
              },
            })}
          />
        </div>
        <div className={styles.tableItem}>
          {weather || (
            <span style={{ opacity: 0.5 }}>
              --
            </span>
          )}
        </div>
        <div className={styles.tableItem}>
          {/* {pseudoWeather?.length ? pseudoWeather.map((weatherState, i) => {
            const [name, minTimeLeft, maxTimeLeft] = weatherState || [];
            const effect = name ? Dex?.getEffect?.(name) : null;

            return (
              <React.Fragment key={`StageCalc-PseudoWeather:${effect?.id || name || i}`}>
                {(effect?.name || name || '').replace(/\s?Terrain/i, '')}

                {
                  (typeof minTimeLeft === 'number' || typeof maxTimeLeft === 'number') &&
                  <span className={cx(styles.statLabel, styles.small)}>
                    {' '}
                    {minTimeLeft}
                    {typeof maxTimeLeft === 'number' && `~${maxTimeLeft}`}
                  </span>
                }
              </React.Fragment>
            );
          }) : 'None'} */}
          {terrain || (
            <span style={{ opacity: 0.5 }}>
              --
            </span>
          )}
        </div>
        <div className={cx(styles.tableItem, styles.right)}>
          {/* {p2SideConditions.length ? p2SideConditions.flatMap((c) => c?.[0]).join(' / ') : 'None'} */}
          <Button
            labelStyle={defenderSide?.isLightScreen ? undefined : { color: '#FFFFFF' }}
            label="Light"
            onPress={() => onFieldChange?.({
              // ...field,
              defenderSide: {
                ...defenderSide,
                isLightScreen: !defenderSide?.isLightScreen,
              },
            })}
          />
          {' '}
          <Button
            labelStyle={defenderSide?.isReflect ? undefined : { color: '#FFFFFF' }}
            label="Reflect"
            onPress={() => onFieldChange?.({
              // ...field,
              defenderSide: {
                ...defenderSide,
                isReflect: !defenderSide?.isReflect,
              },
            })}
          />
          {' '}
          <Button
            labelStyle={defenderSide?.isAuroraVeil ? undefined : { color: '#FFFFFF' }}
            label="Aurora"
            onPress={() => onFieldChange?.({
              // ...field,
              defenderSide: {
                ...defenderSide,
                isAuroraVeil: !defenderSide?.isAuroraVeil,
              },
            })}
          />
        </div>
      </div>
    </div>
  );
};
