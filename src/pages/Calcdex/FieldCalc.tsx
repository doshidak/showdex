import * as React from 'react';
import cx from 'classnames';
import { Button } from '@showdex/components/ui';
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
          <Button
            labelStyle={attackerSide?.isLightScreen ? undefined : { color: '#FFFFFF' }}
            label="Light"
            onPress={() => onFieldChange?.({
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
          {terrain || (
            <span style={{ opacity: 0.5 }}>
              --
            </span>
          )}
        </div>

        <div className={cx(styles.tableItem, styles.right)}>
          <Button
            labelStyle={defenderSide?.isLightScreen ? undefined : { color: '#FFFFFF' }}
            label="Light"
            onPress={() => onFieldChange?.({
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
