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
import type { Weather } from '@smogon/calc/dist/data/interface';
import type { DropdownOption } from '@showdex/components/form';
import type { CalcdexBattleField, CalcdexPlayerKey, CalcdexPlayerSide } from '@showdex/redux/store';
import type { ElementSizeLabel } from '@showdex/utils/hooks';
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
  containerSize?: ElementSizeLabel;
  disabled?: boolean;
  onFieldChange?: (field: DeepPartial<CalcdexBattleField>) => void;
}

const PlayerSideScreensMap: Record<string, keyof CalcdexPlayerSide> = {
  Light: 'isLightScreen',
  Reflect: 'isReflect',
  Aurora: 'isAuroraVeil',
};

const PlayerSideDoublesMap: Record<string, keyof CalcdexPlayerSide> = {
  Hand: 'isHelpingHand',
  Gift: 'isFlowerGift',
  Guard: 'isFriendGuard',
  Battery: 'isBattery',
  Power: 'isPowerSpot',
  Twind: 'isTailwind',
};

const PlayerSideFieldDexMap: Partial<Record<keyof CalcdexPlayerSide, 'abilities' | 'moves'>> = {
  isLightScreen: 'moves',
  isReflect: 'moves',
  isAuroraVeil: 'moves',
  isHelpingHand: 'moves',
  isFriendGuard: 'abilities',
  isFlowerGift: 'abilities',
  isBattery: 'abilities',
  isPowerSpot: 'abilities',
  isTailwind: 'moves',
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
  containerSize,
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

    const value = gen > 8 && option.value === 'Hail' ? 'Snow' : option.value;
    const description = WeatherDescriptions[value]?.shortDesc;

    if (!description) {
      return null;
    }

    return (
      <div className={cx(styles.tooltipContent, styles.descTooltip)}>
        {description}
      </div>
    );
  }, [
    gen,
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
    gameType,
    weather,
    terrain,
    attackerSide: p1Side,
    defenderSide: p2Side,
  } = field || {};

  const doubles = gameType === 'Doubles';

  const sideFieldMap = {
    ...PlayerSideScreensMap,
    ...(doubles && PlayerSideDoublesMap),
  };

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
        doubles && styles.doubles,
        containerSize === 'xs' && styles.verySmol,
        ['md', 'lg', 'xl'].includes(containerSize) && styles.veryThicc,
        !!colorScheme && styles[colorScheme],
        className,
      )}
      style={style}
    >
      {/* table headers */}
      <TableGridItem
        className={cx(
          styles.label,
          styles.leftFieldLabel,
          !authPlayerKey && styles.spectating,
        )}
        align="left"
        header
      >
        {/* p1 screens header */}
        {authPlayerKey ? (
          authPlayerKey === playerKey ? 'Yours' : 'Theirs'
        ) : <>&uarr; {doubles ? 'Field' : 'Screens'}</>}
      </TableGridItem>
      <TableGridItem
        className={cx(styles.label, styles.weatherLabel)}
        header
      >
        Weather
      </TableGridItem>
      <TableGridItem
        className={cx(styles.label, styles.terrainLabel)}
        header
      >
        Terrain
      </TableGridItem>
      <TableGridItem
        className={cx(
          styles.label,
          styles.rightFieldLabel,
          !authPlayerKey && styles.spectating,
        )}
        align="right"
        header
      >
        {/* p2 screens header */}
        {authPlayerKey ? (
          authPlayerKey === playerKey ? 'Theirs' : 'Yours'
        ) : <>{doubles ? 'Field' : 'Screens'} &darr;</>}
      </TableGridItem>

      {/* p1 screens */}
      <TableGridItem
        className={styles.leftFieldInput}
        align="left"
      >
        {Object.entries(sideFieldMap).map(([
          label,
          sideKey,
        ]) => {
          // e.g., 'isAuroraVeil' -> 'AuroraVeil' -> formatId() -> 'auroraveil'
          const screenMoveId = formatId(sideKey.replace('is', ''));
          const dexMapping = PlayerSideFieldDexMap[sideKey];

          const dexFieldEffect = screenMoveId && settings?.showFieldTooltips
            ? dex[dexMapping].get(screenMoveId)
            : null;

          const notAvailable = gen < (dexFieldEffect?.gen || 0);

          if (notAvailable) {
            return null;
          }

          const effectDescription = (dexFieldEffect?.shortDesc || dexFieldEffect?.desc)
            ?.replace("This Pokemon's allies", 'Allies');

          return (
            <React.Fragment
              key={`FieldCalc:${battleId || '?'}:${attackerSideKey}:${label}:ToggleButton`}
            >
              <ToggleButton
                className={styles.toggleButton}
                label={label}
                tooltip={effectDescription ? (
                  <div className={cx(styles.tooltipContent, styles.descTooltip)}>
                    {
                      !!dexFieldEffect.name &&
                      <>
                        <strong>{dexFieldEffect.name}</strong>
                        <br />
                      </>
                    }
                    {effectDescription}
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

              {/* {i < Object.keys(sideFieldMap).length - 1 && ' '} */}
            </React.Fragment>
          );
        })}
      </TableGridItem>

      {/* weather */}
      <TableGridItem className={styles.weatherInput}>
        <Dropdown
          style={{ textAlign: 'left' }}
          aria-label="Field Weather"
          hint={gen === 1 ? 'N/A' : 'None'}
          optionTooltip={weatherTooltip}
          optionTooltipProps={{ hidden: !settings?.showFieldTooltips }}
          input={{
            name: `FieldCalc:${battleId || '?'}:Weather:Dropdown`,
            value: weather,
            onChange: (updatedWeather: CalcdexBattleField['weather']) => onFieldChange?.({
              weather: updatedWeather,
            }),
          }}
          options={(gen > 5 ? WeatherNames : [
            ...LegacyWeatherNames,
            gen > 2 && WeatherMap.hail,
          ].filter(Boolean)).map((name: Weather) => ({
            /**
             * @todo hmm kinda gross no? lol
             */
            label: (
              gen > 8 && name === 'Hail' // for gen 9, but > 8 for posterity lol
                ? 'Snow' // `value` would still be 'Hail' btw
                : WeatherDescriptions[name]?.label
            ) || name,
            value: name,
          }))}
          noOptionsMessage="No Weather"
          highlight={!!weather}
          disabled={disabled || !battleId || gen === 1}
        />
      </TableGridItem>

      {/* terrain */}
      <TableGridItem className={styles.terrainInput}>
        <Dropdown
          style={{ textAlign: 'left' }}
          aria-label="Field Terrain"
          hint={gen < 6 ? 'N/A' : 'None'}
          optionTooltip={terrainTooltip}
          optionTooltipProps={{ hidden: !settings?.showFieldTooltips }}
          input={{
            name: `FieldCalc:${battleId || '?'}:Terrain:Dropdown`,
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
          highlight={!!terrain}
          disabled={disabled || !battleId || gen < 6}
        />
      </TableGridItem>

      {/* opponent's screens */}
      <TableGridItem
        className={styles.rightFieldInput}
        align="right"
      >
        {Object.entries(sideFieldMap).map(([
          label,
          sideKey,
        ]) => {
          const screenMoveId = formatId(sideKey.replace('is', ''));
          const dexMapping = PlayerSideFieldDexMap[sideKey];

          const dexFieldEffect = screenMoveId && settings?.showFieldTooltips
            ? dex[dexMapping].get(screenMoveId)
            : null;

          const notAvailable = gen < (dexFieldEffect?.gen || 0);

          if (notAvailable) {
            return null;
          }

          const effectDescription = (dexFieldEffect?.shortDesc || dexFieldEffect?.desc)
            ?.replace("This Pokemon's allies", 'Allies');

          return (
            <React.Fragment
              key={`FieldCalc:${battleId || '?'}:${defenderSideKey}:${label}:ToggleButton`}
            >
              <ToggleButton
                className={styles.toggleButton}
                label={label}
                tooltip={effectDescription ? (
                  <div className={cx(styles.tooltipContent, styles.descTooltip)}>
                    {
                      !!dexFieldEffect.name &&
                      <>
                        <strong>{dexFieldEffect.name}</strong>
                        <br />
                      </>
                    }
                    {effectDescription}
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

              {/* {i < Object.keys(sideFieldMap).length - 1 && ' '} */}
            </React.Fragment>
          );
        })}
      </TableGridItem>
    </TableGrid>
  );
};
