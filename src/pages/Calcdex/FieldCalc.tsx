import * as React from 'react';
import cx from 'classnames';
import { Dropdown } from '@showdex/components/form';
import { TableGrid, TableGridItem } from '@showdex/components/layout';
import { Button } from '@showdex/components/ui';
import {
  LegacyWeatherNames,
  TerrainNames,
  WeatherMap,
  WeatherNames,
} from '@showdex/consts';
import { useColorScheme } from '@showdex/redux/store';
// import { detectLegacyGen } from '@showdex/utils/battle';
import type { GenerationNum } from '@smogon/calc';
import type { CalcdexBattleField, CalcdexPlayerKey } from '@showdex/redux/store';
import styles from './FieldCalc.module.scss';

interface FieldCalcProps {
  className?: string;
  style?: React.CSSProperties;
  battleId?: string;
  gen?: GenerationNum;
  authPlayerKey?: CalcdexPlayerKey;
  playerKey?: CalcdexPlayerKey;
  field?: CalcdexBattleField;
  onFieldChange?: (field: DeepPartial<CalcdexBattleField>) => void;
}

export const FieldCalc = ({
  className,
  style,
  battleId,
  gen,
  authPlayerKey,
  playerKey = 'p1',
  field,
  onFieldChange,
}: FieldCalcProps): JSX.Element => {
  const colorScheme = useColorScheme();

  // const legacy = detectLegacyGen(gen);

  const {
    weather,
    terrain,
    attackerSide: p1Side,
    defenderSide: p2Side,
  } = field || {};

  const p1Attacker = [authPlayerKey, playerKey].filter(Boolean).includes('p1');

  const attackerSide = p1Attacker ? p1Side : p2Side;
  const attackerSideKey: keyof CalcdexBattleField = p1Attacker ? 'attackerSide' : 'defenderSide';

  const defenderSide = p1Attacker ? p2Side : p1Side;
  const defenderSideKey: keyof CalcdexBattleField = p1Attacker ? 'defenderSide' : 'attackerSide';

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
        {/* p1 screens header */}
        {authPlayerKey ? (
          authPlayerKey === playerKey ? 'Your' : 'Their'
        ) + ' ' : <>&uarr; </>}
        Screens
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
        {/* p2 screens header */}
        {!!authPlayerKey && (
          authPlayerKey === playerKey ? 'Their' : 'Your'
        ) + ' '}
        Screens
        {!authPlayerKey && <> &darr;</>}
      </TableGridItem>

      {/* p1 screens */}
      <TableGridItem align="left">
        <Button
          className={cx(
            styles.toggleButton,
            !attackerSide?.isLightScreen && styles.inactive,
          )}
          labelClassName={styles.toggleButtonLabel}
          label="Light"
          disabled={!battleId || !p1Side}
          onPress={() => onFieldChange?.({
            [attackerSideKey]: {
              ...attackerSide,
              isLightScreen: !attackerSide?.isLightScreen,
            },
          })}
        />
        {' '}

        <Button
          className={cx(
            styles.toggleButton,
            !attackerSide?.isReflect && styles.inactive,
          )}
          labelClassName={styles.toggleButtonLabel}
          label="Reflect"
          disabled={!battleId || !p1Side}
          onPress={() => onFieldChange?.({
            [attackerSideKey]: {
              ...attackerSide,
              isReflect: !attackerSide?.isReflect,
            },
          })}
        />

        {' '}
        <Button
          className={cx(
            styles.toggleButton,
            !attackerSide?.isAuroraVeil && styles.inactive,
          )}
          labelClassName={styles.toggleButtonLabel}
          label="Aurora"
          disabled={!battleId || !p1Side || gen < 7}
          onPress={() => onFieldChange?.({
            [attackerSideKey]: {
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
          hint={gen === 1 ? 'N/A' : 'None'}
          input={{
            name: `FieldCalc:Weather:${battleId || '???'}`,
            value: weather,
            onChange: (updatedWeather: CalcdexBattleField['weather']) => onFieldChange?.({
              weather: updatedWeather,
            }),
          }}
          options={(gen > 5 ? WeatherNames : [
            ...LegacyWeatherNames,
            gen > 2 && WeatherMap.hail,
          ].filter(Boolean).sort()).map((name) => ({
            label: name,
            value: name,
          }))}
          noOptionsMessage="No Weather"
          disabled={!battleId || gen === 1}
        />
      </TableGridItem>

      {/* terrain */}
      <TableGridItem>
        <Dropdown
          style={{ textAlign: 'left' }}
          aria-label="Field Terrain"
          hint={gen < 6 ? 'N/A' : 'None'}
          input={{
            name: `FieldCalc:Terrain:${battleId || '???'}`,
            value: terrain,
            onChange: (updatedTerrain: CalcdexBattleField['terrain']) => onFieldChange?.({
              terrain: updatedTerrain,
            }),
          }}
          options={TerrainNames.map((name) => ({
            label: name,
            value: name,
          }))}
          noOptionsMessage="No Terrain"
          disabled={!battleId || gen < 6}
        />
      </TableGridItem>

      {/* opponent's screens */}
      <TableGridItem align="right">
        <Button
          className={cx(
            styles.toggleButton,
            !defenderSide?.isLightScreen && styles.inactive,
          )}
          labelClassName={styles.toggleButtonLabel}
          label="Light"
          disabled={!battleId || !p2Side}
          onPress={() => onFieldChange?.({
            [defenderSideKey]: {
              ...defenderSide,
              isLightScreen: !defenderSide?.isLightScreen,
            },
          })}
        />

        {' '}
        <Button
          className={cx(
            styles.toggleButton,
            !defenderSide?.isReflect && styles.inactive,
          )}
          labelClassName={styles.toggleButtonLabel}
          label="Reflect"
          disabled={!battleId || !p2Side}
          onPress={() => onFieldChange?.({
            [defenderSideKey]: {
              ...defenderSide,
              isReflect: !defenderSide?.isReflect,
            },
          })}
        />

        {' '}
        <Button
          className={cx(
            styles.toggleButton,
            !defenderSide?.isAuroraVeil && styles.inactive,
          )}
          labelClassName={styles.toggleButtonLabel}
          label="Aurora"
          disabled={!battleId || !p2Side || gen < 7}
          onPress={() => onFieldChange?.({
            [defenderSideKey]: {
              ...defenderSide,
              isAuroraVeil: !defenderSide?.isAuroraVeil,
            },
          })}
        />
      </TableGridItem>
    </TableGrid>
  );
};
