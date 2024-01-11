import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import cx from 'classnames';
import { type Weather } from '@smogon/calc';
import { type DropdownOption, Dropdown } from '@showdex/components/form';
import { TableGrid, TableGridItem } from '@showdex/components/layout';
import { ToggleButton } from '@showdex/components/ui';
import { times } from '@showdex/consts/core';
import {
  PlayerSideConditionsDexMap,
  PlayerSideConditionsToggleMap,
  PlayerSideScreensToggleMap,
  TerrainNames,
} from '@showdex/consts/dex';
import { type CalcdexBattleField, type CalcdexPlayerKey } from '@showdex/interfaces/calc';
import { useColorScheme } from '@showdex/redux/store';
import { formatId } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { formatDexDescription, getDexForFormat, getWeatherConditions } from '@showdex/utils/dex';
import { useCalcdexContext } from '../CalcdexContext';
import styles from './FieldCalc.module.scss';

export interface FieldCalcProps {
  className?: string;
  style?: React.CSSProperties;
  playerKey?: CalcdexPlayerKey;
  opponentKey?: CalcdexPlayerKey;
}

const l = logger('@showdex/components/calc/FieldCalc');

export const FieldCalc = ({
  className,
  style,
  playerKey = 'p1',
  opponentKey = 'p2',
}: FieldCalcProps): JSX.Element => {
  const { t } = useTranslation('calcdex');

  const {
    state,
    settings,
    updateSide,
    updateField,
  } = useCalcdexContext();

  const {
    operatingMode,
    battleId,
    containerSize,
    gen,
    format,
    authPlayerKey,
    field,
  } = state;

  const {
    weather,
    terrain,
  } = field || {};

  const colorScheme = useColorScheme();
  const dex = getDexForFormat(format);

  const weatherTooltip = React.useCallback((option: DropdownOption<CalcdexBattleField['weather']>) => {
    if (!option?.value || !settings?.showFieldTooltips) {
      return null;
    }

    return (
      <Trans
        t={t}
        i18nKey={`pokedex:weather.${formatId(option.value)}.shortDesc`}
        parent="div"
        className={cx(styles.tooltipContent, styles.descTooltip)}
        shouldUnescape
        values={{ times }}
      />
    );
  }, [
    settings,
    t,
  ]);

  const terrainTooltip = React.useCallback((option: DropdownOption<CalcdexBattleField['terrain']>) => {
    if (!option?.value || !settings?.showFieldTooltips) {
      return null;
    }

    return (
      <Trans
        t={t}
        i18nKey={`pokedex:terrain.${formatId(option.value)}.shortDesc`}
        parent="div"
        className={cx(styles.tooltipContent, styles.descTooltip)}
        shouldUnescape
        values={{ times }}
      />
    );
  }, [
    settings,
    t,
  ]);

  const doubles = state?.gameType === 'Doubles';
  const natDexFormat = !['nationaldex', 'natdex'].some((f) => format?.includes(f));

  const sideFieldMap: typeof PlayerSideScreensToggleMap = {
    ...PlayerSideScreensToggleMap,
    ...(operatingMode === 'standalone' && !doubles && { Twind: PlayerSideConditionsToggleMap.Twind }),
    ...(doubles && PlayerSideConditionsToggleMap),
  };

  // update (2023/01/06): as per an executive order from camdawgboi, these toggles will be removed in
  // Gen 9 for non-National Dex formats (though, are there any doubles National Dex formats?)
  if (gen === 9 && doubles && natDexFormat) {
    delete sideFieldMap.Gift;
    delete sideFieldMap.Battery;
    delete sideFieldMap.Power;
  }

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
          t(`field.${authPlayerKey === playerKey ? 'yours' : 'theirs'}`)
        ) : (
          <>
            &uarr;{' '}
            {t(`field.${operatingMode === 'standalone' || doubles ? 'field' : 'screens'}`)}
          </>
        )}
      </TableGridItem>
      <TableGridItem
        className={cx(
          styles.label,
          styles.weatherLabel,
          gen === 1 && styles.legacy,
        )}
        header
      >
        {t('field.weather.label')}
      </TableGridItem>
      <TableGridItem
        className={cx(
          styles.label,
          styles.terrainLabel,
          gen < 6 && styles.legacy,
        )}
        header
      >
        {t('field.terrain.label')}
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
          t(`field.${authPlayerKey === playerKey ? 'theirs' : 'yours'}`)
        ) : (
          <>
            {t(`field.${operatingMode === 'standalone' || doubles ? 'field' : 'screens'}`)}
            {' '}&darr;
          </>
        )}
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

          const effectDescription = formatDexDescription(
            (dexFieldEffect?.shortDesc || dexFieldEffect?.desc)
              ?.replace("This Pokemon's allies", 'Allies'),
          );

          return (
            <React.Fragment key={`${l.scope}:${battleId || '???'}:${playerKey}:${label}`}>
              <ToggleButton
                className={styles.toggleButton}
                label={t(`field.conditions.${formatId(label)}`)}
                tooltip={effectDescription ? (
                  <div className={cx(styles.tooltipContent, styles.descTooltip)}>
                    {
                      !!dexFieldEffect.name &&
                      <>
                        <strong>
                          {t(`pokedex:${dexMapping}.${formatId(dexFieldEffect.name)}`, dexFieldEffect.name)}
                        </strong>
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
          aria-label={t('field.weather.aria') as React.ReactNode}
          hint={t(`field.weather.${gen === 1 ? 'legacyH' : 'h'}int`) as React.ReactNode}
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
            label: t(`pokedex:weather.${formatId(name)}.label`, name),
            value: name,
          }))}
          noOptionsMessage={t('field.weather.empty') as React.ReactNode}
          highlight={!!weather}
          disabled={disabled || !battleId || gen === 1}
        />
      </TableGridItem>

      {/* terrain */}
      <TableGridItem className={styles.terrainInput}>
        <Dropdown
          style={{ textAlign: 'left' }}
          aria-label={t('field.terrain.aria') as React.ReactNode}
          hint={t(`field.terrain.${gen < 6 ? 'legacyH' : 'h'}int`) as React.ReactNode}
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
            label: t(`pokedex:terrain.${formatId(name)}.label`, name),
            value: name,
          }))}
          noOptionsMessage={t('field.terrain.empty') as React.ReactNode}
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

          const effectDescription = formatDexDescription(
            (dexFieldEffect?.shortDesc || dexFieldEffect?.desc)
              ?.replace("This Pokemon's allies", 'Allies'),
          );

          return (
            <React.Fragment key={`${l.scope}:${battleId || '???'}:${opponentKey}:${label}`}>
              <ToggleButton
                className={styles.toggleButton}
                label={t(`field.conditions.${formatId(label)}`)}
                tooltip={effectDescription ? (
                  <div className={cx(styles.tooltipContent, styles.descTooltip)}>
                    {
                      !!dexFieldEffect.name &&
                      <>
                        <strong>
                          {t(`pokedex:${dexMapping}.${formatId(dexFieldEffect.name)}`, dexFieldEffect.name)}
                        </strong>
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
