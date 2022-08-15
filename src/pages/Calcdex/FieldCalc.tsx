import * as React from 'react';
import cx from 'classnames';
import { useColorScheme } from '@showdex/components/app';
import { Dropdown } from '@showdex/components/form';
import { TableGrid, TableGridItem } from '@showdex/components/layout';
import { Button } from '@showdex/components/ui';
import { TerrainNames, WeatherNames } from '@showdex/consts';
import type { CalcdexBattleField, CalcdexPlayerKey } from '@showdex/redux/store';
import styles from './FieldCalc.module.scss';

interface FieldCalcProps {
  className?: string;
  style?: React.CSSProperties;
  battleId?: string;
  playerKey?: CalcdexPlayerKey;
  field?: CalcdexBattleField;
  onFieldChange?: (field: DeepPartial<CalcdexBattleField>) => void;
}

export const FieldCalc = ({
  className,
  style,
  battleId,
  playerKey = 'p1',
  field,
  onFieldChange,
}: FieldCalcProps): JSX.Element => {
  const colorScheme = useColorScheme();

  const {
    weather,
    terrain,
    attackerSide: p1Side,
    defenderSide: p2Side,
  } = field || {};

  const attackerSide = playerKey === 'p1' ? p1Side : p2Side;
  const defenderSide = playerKey === 'p1' ? p2Side : p1Side;

  return (
    <TableGrid
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        className,
      )}
      style={style}
    >
      {/* table headers */}
      <TableGridItem
        className={styles.label}
        align="left"
        header
      >
        Your Screens
      </TableGridItem>
      <TableGridItem
        className={styles.label}
        header
      >
        Weather
      </TableGridItem>
      <TableGridItem
        className={styles.label}
        header
      >
        Terrain
      </TableGridItem>
      <TableGridItem
        className={styles.label}
        align="right"
        header
      >
        Their Screens
      </TableGridItem>

      {/* player's screens */}
      <TableGridItem align="left">
        <Button
          className={styles.toggleButton}
          labelClassName={cx(
            styles.toggleButtonLabel,
            !attackerSide?.isLightScreen && styles.inactive,
          )}
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
          className={styles.toggleButton}
          labelClassName={cx(
            styles.toggleButtonLabel,
            !attackerSide?.isReflect && styles.inactive,
          )}
          label="Reflect"
          onPress={() => onFieldChange?.({
            attackerSide: {
              ...attackerSide,
              isReflect: !attackerSide?.isReflect,
            },
          })}
        />

        {' '}
        <Button
          className={styles.toggleButton}
          labelClassName={cx(
            styles.toggleButtonLabel,
            !attackerSide?.isAuroraVeil && styles.inactive,
          )}
          label="Aurora"
          onPress={() => onFieldChange?.({
            attackerSide: {
              ...attackerSide,
              isAuroraVeil: !attackerSide?.isAuroraVeil,
            },
          })}
        />
      </TableGridItem>

      {/* weather */}
      <TableGridItem>
        <Dropdown
          style={{ textAlign: 'left' }}
          aria-label="Field Weather"
          hint="None"
          input={{
            name: `FieldCalc:Weather:${battleId || '???'}`,
            value: weather,
            onChange: (updatedWeather: CalcdexBattleField['weather']) => onFieldChange?.({
              weather: updatedWeather,
            }),
          }}
          options={WeatherNames.map((weatherName) => ({
            label: weatherName,
            value: weatherName,
          }))}
          noOptionsMessage="No Weather"
        />
      </TableGridItem>

      {/* terrain */}
      <TableGridItem>
        <Dropdown
          style={{ textAlign: 'left' }}
          aria-label="Field Terrain"
          hint="None"
          input={{
            name: `FieldCalc:Terrain:${battleId || '???'}`,
            value: terrain,
            onChange: (updatedTerrain: CalcdexBattleField['terrain']) => onFieldChange?.({
              terrain: updatedTerrain,
            }),
          }}
          options={TerrainNames.map((terrainName) => ({
            label: terrainName,
            value: terrainName,
          }))}
          noOptionsMessage="No Terrain"
        />
      </TableGridItem>

      {/* opponent's screens */}
      <TableGridItem align="right">
        <Button
          className={styles.toggleButton}
          labelClassName={cx(
            styles.toggleButtonLabel,
            !defenderSide?.isLightScreen && styles.inactive,
          )}
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
          className={styles.toggleButton}
          labelClassName={cx(
            styles.toggleButtonLabel,
            !defenderSide?.isReflect && styles.inactive,
          )}
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
          className={styles.toggleButton}
          labelClassName={cx(
            styles.toggleButtonLabel,
            !defenderSide?.isAuroraVeil && styles.inactive,
          )}
          label="Aurora"
          onPress={() => onFieldChange?.({
            // ...field,
            defenderSide: {
              ...defenderSide,
              isAuroraVeil: !defenderSide?.isAuroraVeil,
            },
          })}
        />
      </TableGridItem>
    </TableGrid>
  );
};
