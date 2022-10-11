import * as React from 'react';
import cx from 'classnames';
import { Dropdown } from '@showdex/components/form';
import { TableGrid, TableGridItem } from '@showdex/components/layout';
import { ToggleButton } from '@showdex/components/ui';
import {
  LegacyWeatherNames,
  TerrainDescriptions,
  TerrainNames,
  WeatherDescriptions,
  WeatherMap,
  WeatherNames,
} from '@showdex/consts/field';
import { useCalcdexSettings, useColorScheme } from '@showdex/redux/store';
import { formatId } from '@showdex/utils/app';
import { getDexForFormat } from '@showdex/utils/battle';
import type { GenerationNum } from '@smogon/calc';
import type { DropdownOption } from '@showdex/components/form';
import type { CalcdexBattleField, CalcdexPlayerKey, CalcdexPlayerSide } from '@showdex/redux/store';
import styles from './FieldCalc.module.scss';

interface FieldCalcProps {
  className?: string;
  style?: React.CSSProperties;
  battleId?: string;
  gen?: GenerationNum;
  format?: string;
  authPlayerKey?: CalcdexPlayerKey;
  playerKey?: CalcdexPlayerKey;
  field?: CalcdexBattleField;
  disabled?: boolean;
  onFieldChange?: (field: DeepPartial<CalcdexBattleField>) => void;
}

const PlayerSideScreensMap: Record<string, keyof CalcdexPlayerSide> = {
  Light: 'isLightScreen',
  Reflect: 'isReflect',
  Aurora: 'isAuroraVeil',
};

export const FieldCalc = ({
  className,
  style,
  battleId,
  gen,
  format,
  authPlayerKey,
  playerKey = 'p1',
  field,
  disabled,
  onFieldChange,
}: FieldCalcProps): JSX.Element => {
  const settings = useCalcdexSettings();
  const colorScheme = useColorScheme();

  const dex = getDexForFormat(format);
  // const legacy = detectLegacyGen(gen);

  const weatherTooltip = React.useCallback((option: DropdownOption<CalcdexBattleField['weather']>) => {
    if (!option?.value || !settings?.showFieldTooltips) {
      return null;
    }

    const description = WeatherDescriptions[option.value]?.shortDesc;

    if (!description) {
      return null;
    }

    return (
      <div className={cx(styles.tooltipContent, styles.descTooltip)}>
        {description}
      </div>
    );
  }, [
    settings,
  ]);

  const terrainTooltip = React.useCallback((option: DropdownOption<CalcdexBattleField['terrain']>) => {
    if (!option?.value || !settings?.showFieldTooltips) {
      return null;
    }

    const description = TerrainDescriptions[option.value]?.shortDesc;

    if (!description) {
      return null;
    }

    return (
      <div className={cx(styles.tooltipContent, styles.descTooltip)}>
        {description}
      </div>
    );
  }, [
    settings,
  ]);

  const {
    weather,
    terrain,
    attackerSide: p1Side,
    defenderSide: p2Side,
  } = field || {};

  // const p1Attacker = [authPlayerKey, playerKey].filter(Boolean).includes('p1');
  const p1Attacker = playerKey === 'p1';

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
        className={cx(styles.label, styles.leftScreens)}
        align="left"
        header
      >
        {/* p1 screens header */}
        {authPlayerKey ? (
          authPlayerKey === playerKey ? 'Yours' : 'Theirs'
        ) : <>&uarr; Screens</>}
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
        className={cx(styles.label, styles.rightScreens)}
        align="right"
        header
      >
        {/* p2 screens header */}
        {authPlayerKey ? (
          authPlayerKey === playerKey ? 'Theirs' : 'Yours'
        ) : <>Screens &darr;</>}
        {/* Screens */}
        {/* {!authPlayerKey && <> &darr;</>} */}
      </TableGridItem>

      {/* p1 screens */}
      <TableGridItem align="left">
        {Object.entries(PlayerSideScreensMap).map(([label, sideKey], i) => {
          // e.g., 'isAuroraVeil' -> 'AuroraVeil' -> formatId() -> 'auroraveil'
          const screenMoveId = formatId(sideKey.replace('is', ''));
          const dexScreenMove = screenMoveId && settings?.showFieldTooltips
            ? dex.moves.get(screenMoveId)
            : null;

          const screenDescription = dexScreenMove?.shortDesc || dexScreenMove?.desc;

          return (
            <React.Fragment key={`FieldCalc:${battleId || '???'}:${attackerSideKey}:${label}:ToggleButton`}>
              <ToggleButton
                className={styles.toggleButton}
                label={label}
                tooltip={screenDescription ? (
                  <div className={cx(styles.tooltipContent, styles.descTooltip)}>
                    {screenDescription}
                  </div>
                ) : null}
                primary
                active={!!attackerSide?.[sideKey]}
                disabled={disabled || !battleId || !attackerSideKey || !attackerSide}
                onPress={() => onFieldChange?.({
                  [attackerSideKey]: {
                    ...attackerSide,
                    [sideKey]: !attackerSide?.[sideKey],
                  },
                })}
              />

              {i < Object.keys(PlayerSideScreensMap).length - 1 && ' '}
            </React.Fragment>
          );
        })}
      </TableGridItem>

      {/* weather */}
      <TableGridItem>
        <Dropdown
          style={{ textAlign: 'left' }}
          aria-label="Field Weather"
          hint={gen === 1 ? 'N/A' : 'None'}
          // tooltip={weather && settings?.showFieldTooltips && WeatherDescriptions[weather]?.shortDesc ? (
          //   <div className={cx(styles.tooltipContent, styles.descTooltip)}>
          //     {WeatherDescriptions[weather].shortDesc}
          //   </div>
          // ) : null}
          optionTooltip={weatherTooltip}
          optionTooltipProps={{ hidden: !settings?.showFieldTooltips }}
          input={{
            name: `FieldCalc:${battleId || '???'}:Weather:Dropdown`,
            value: weather,
            onChange: (updatedWeather: CalcdexBattleField['weather']) => onFieldChange?.({
              weather: updatedWeather,
            }),
          }}
          options={(gen > 5 ? WeatherNames : [
            ...LegacyWeatherNames,
            gen > 2 && WeatherMap.hail,
          ].filter(Boolean).sort()).map((name) => ({
            /** @todo gross */
            label: name === 'Harsh Sunshine' ? 'Intense Sun' : name,
            value: name,
          }))}
          noOptionsMessage="No Weather"
          disabled={disabled || !battleId || gen === 1}
        />
      </TableGridItem>

      {/* terrain */}
      <TableGridItem>
        <Dropdown
          style={{ textAlign: 'left' }}
          aria-label="Field Terrain"
          hint={gen < 6 ? 'N/A' : 'None'}
          // tooltip={terrain && settings?.showFieldTooltips && TerrainDescriptions[terrain]?.shortDesc ? (
          //   <div className={cx(styles.tooltipContent, styles.descTooltip)}>
          //     {TerrainDescriptions[terrain].shortDesc}
          //   </div>
          // ) : null}
          optionTooltip={terrainTooltip}
          optionTooltipProps={{ hidden: !settings?.showFieldTooltips }}
          input={{
            name: `FieldCalc:${battleId || '???'}:Terrain:Dropdown`,
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
          disabled={disabled || !battleId || gen < 6}
        />
      </TableGridItem>

      {/* opponent's screens */}
      <TableGridItem align="right">
        {Object.entries(PlayerSideScreensMap).map(([label, sideKey], i) => {
          const screenMoveId = formatId(sideKey.replace('is', ''));
          const dexScreenMove = screenMoveId && settings?.showFieldTooltips
            ? dex.moves.get(screenMoveId)
            : null;

          const screenDescription = dexScreenMove?.shortDesc || dexScreenMove?.desc;

          return (
            <React.Fragment key={`FieldCalc:${battleId || '???'}:${defenderSideKey}:${label}:ToggleButton`}>
              <ToggleButton
                className={styles.toggleButton}
                label={label}
                tooltip={screenDescription ? (
                  <div className={cx(styles.tooltipContent, styles.descTooltip)}>
                    {screenDescription}
                  </div>
                ) : null}
                primary
                active={!!defenderSide?.[sideKey]}
                disabled={disabled || !battleId || !defenderSideKey || !defenderSide}
                onPress={() => onFieldChange?.({
                  [defenderSideKey]: {
                    ...defenderSide,
                    [sideKey]: !defenderSide?.[sideKey],
                  },
                })}
              />

              {i < Object.keys(PlayerSideScreensMap).length - 1 && ' '}
            </React.Fragment>
          );
        })}
      </TableGridItem>
    </TableGrid>
  );
};
