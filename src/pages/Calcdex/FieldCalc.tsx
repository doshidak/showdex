import * as React from 'react';
import cx from 'classnames';
import { Dropdown } from '@showdex/components/form';
import { TableGrid, TableGridItem } from '@showdex/components/layout';
import { Button } from '@showdex/components/ui';
import { TerrainNames, WeatherNames } from '@showdex/consts';
import type { CalcdexBattleField } from './CalcdexReducer';
import styles from './FieldCalc.module.scss';

interface FieldCalcProps {
  className?: string;
  style?: React.CSSProperties;
  battleId?: string;
  field?: CalcdexBattleField;
  onFieldChange?: (field: Partial<CalcdexBattleField>) => void;
}

export const FieldCalc = ({
  className,
  style,
  battleId,
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
    <TableGrid
      className={cx(styles.container, className)}
      style={style}
    >
      {/* table headers */}
      <TableGridItem align="left" header>
        Your Screens
      </TableGridItem>
      <TableGridItem header>
        Weather
      </TableGridItem>
      <TableGridItem header>
        Terrain
      </TableGridItem>
      <TableGridItem align="right" header>
        Their Screens
      </TableGridItem>

      {/* player's screens */}
      <TableGridItem align="left">
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
      </TableGridItem>
    </TableGrid>
  );
};
