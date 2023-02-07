import * as React from 'react';
import cx from 'classnames';
import { Dropdown } from '@showdex/components/form';
import { TableGrid, TableGridItem } from '@showdex/components/layout';
import { ToggleButton } from '@showdex/components/ui';
import {
  // LegacyWeatherNames,
  PlayerSideConditionsDexMap,
  PlayerSideConditionsToggleMap,
  PlayerSideScreensToggleMap,
  TerrainDescriptions,
  TerrainNames,
  WeatherDescriptions,
  // WeatherMap,
  // WeatherNames,
} from '@showdex/consts/field';
import { useColorScheme } from '@showdex/redux/store';
import { formatId } from '@showdex/utils/app';
import { getDexForFormat, getWeatherConditions } from '@showdex/utils/battle';
// import type { GenerationNum } from '@smogon/calc';
import type { Weather } from '@smogon/calc/dist/data/interface';
import type { DropdownOption } from '@showdex/components/form';
import type { CalcdexBattleField, CalcdexPlayerKey } from '@showdex/redux/store';
import type { ElementSizeLabel } from '@showdex/utils/hooks';
import { useCalcdexContext } from './CalcdexProvider';
import styles from './FieldCalc.module.scss';

interface FieldCalcProps {
  className?: string;
  style?: React.CSSProperties;
  playerKey?: CalcdexPlayerKey;
  opponentKey?: CalcdexPlayerKey;
  containerSize?: ElementSizeLabel;
}

export const FieldCalc = ({
  className,
  style,
  playerKey = 'p1',
  opponentKey = 'p2',
  containerSize,
}: FieldCalcProps): JSX.Element => {
  const {
    state,
    settings,
    updateSide,
    updateField,
  } = useCalcdexContext();

  const {
    battleId,
    gen,
    format,
    authPlayerKey,
    // p1,
    // p2,
    field,
  } = state;

  const {
    gameType,
    weather,
    terrain,
    // attackerSide: p1Side,
    // defenderSide: p2Side,
  } = field || {};

  const colorScheme = useColorScheme();
  const dex = getDexForFormat(format);

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
    // gen,
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

  const doubles = gameType === 'Doubles';

  const sideFieldMap = {
    ...PlayerSideScreensToggleMap,
    ...(doubles && PlayerSideConditionsToggleMap),
  };

  // update (2023/01/06): as per an executive order from camdawgboi, these toggles will be removed in
  // Gen 9 for non-National Dex formats (though, are there any doubles National Dex formats?)
  if (gen === 9 && doubles && !['nationaldex', 'natdex'].some((f) => format.includes(f))) {
    delete sideFieldMap.Gift;
    delete sideFieldMap.Battery;
    delete sideFieldMap.Power;
  }

  // const p1Attacker = playerKey === 'p1';
  // const attackerSide = p1Attacker ? p1Side : p2Side;
  // const attackerSideKey: keyof CalcdexBattleField = p1Attacker ? 'attackerSide' : 'defenderSide';

  // const defenderSide = p1Attacker ? p2Side : p1Side;
  // const defenderSideKey: keyof CalcdexBattleField = p1Attacker ? 'defenderSide' : 'attackerSide';

  // update (2023/01/23): CalcdexPlayerSide's (formerly attached to attackerSide and defenderSide of CalcdexBattleField)
  // are now attached to each individual CalcdexPlayer under the `side` property; attackerSide and defenderSide are
  // dynamically set during instantiation of the Smogon.Field in createSmogonField()
  const playerSide = state[playerKey]?.side; // i.e., attackingSide
  const opponentSide = state[opponentKey]?.side; // i.e., defendingSide

  const disabled = !state[playerKey]?.pokemon?.length
    || !state[opponentKey]?.pokemon?.length;

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
          const dexMapping = PlayerSideConditionsDexMap[sideKey];

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
              key={`FieldCalc:${battleId || '???'}:${playerKey}:${label}:ToggleButton`}
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
                active={!!playerSide?.[sideKey]}
                disabled={disabled || !battleId || !playerSide}
                onPress={() => updateSide(playerKey, {
                  [sideKey]: !playerSide?.[sideKey],
                })}
              />
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
            name: `FieldCalc:${battleId || '???'}:Weather:Dropdown`,
            value: weather,
            onChange: (updatedWeather: CalcdexBattleField['weather']) => updateField({
              weather: updatedWeather,
            }),
          }}
          options={getWeatherConditions(format).map((name: Weather) => ({
            label: WeatherDescriptions[name]?.label || name,
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
            name: `FieldCalc:${battleId || '???'}:Terrain:Dropdown`,
            value: terrain,
            onChange: (updatedTerrain: CalcdexBattleField['terrain']) => updateField({
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
          const dexMapping = PlayerSideConditionsDexMap[sideKey];

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
              key={`FieldCalc:${battleId || '???'}:${opponentKey}:${label}:ToggleButton`}
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
                active={!!opponentSide?.[sideKey]}
                disabled={disabled || !battleId || !opponentSide}
                onPress={() => updateSide(opponentKey, {
                  [sideKey]: !opponentSide?.[sideKey],
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
