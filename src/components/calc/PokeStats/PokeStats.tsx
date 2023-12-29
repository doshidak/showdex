import * as React from 'react';
import cx from 'classnames';
import { ValueField } from '@showdex/components/form';
import { TableGrid, TableGridItem } from '@showdex/components/layout';
import { Button, ToggleButton, Tooltip } from '@showdex/components/ui';
import { PokemonBoostNames, PokemonNatureBoosts, PokemonStatNames } from '@showdex/consts/dex';
import { CalcdexPlayerKeys as AllPlayerKeys } from '@showdex/interfaces/calc';
import { useColorScheme } from '@showdex/redux/store';
import { calcPokemonFinalStats, convertIvToLegacyDv, convertLegacyDvToIv } from '@showdex/utils/calc';
import { env } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { getDefaultSpreadValue, legalLockedFormat } from '@showdex/utils/dex';
import { useRandomUuid } from '@showdex/utils/hooks';
import { pluralize } from '@showdex/utils/humanize';
import { detectStatBoostDelta, formatStatBoost } from '@showdex/utils/ui';
import { useCalcdexPokeContext } from '../CalcdexPokeContext';
import styles from './PokeStats.module.scss';

export interface PokeStatsProps {
  className?: string;
  style?: React.CSSProperties;
}

const l = logger('@showdex/components/calc/PokeStats');

export const PokeStats = ({
  className,
  style,
}: PokeStatsProps): JSX.Element => {
  const {
    state,
    settings,
    player,
    playerKey, // don't use the one from state btw
    playerPokemon: pokemon,
    opponent,
    opponentPokemon,
    updatePokemon,
  } = useCalcdexPokeContext();

  const {
    containerSize,
    gen,
    format,
    legacy,
    authPlayerKey,
    field,
  } = state;

  const colorScheme = useColorScheme();
  const randomUuid = useRandomUuid();

  const pokemonKey = pokemon?.calcdexId || pokemon?.name || randomUuid || '???';
  const friendlyPokemonName = pokemon?.speciesForme || pokemon?.name || pokemonKey;

  const statNames = PokemonStatNames.filter((stat) => gen !== 1 || stat !== 'spd');
  const boostNames = PokemonBoostNames.filter((stat) => gen !== 1 || stat !== 'spd');

  const shouldShowBaseStats = settings?.showBaseStats === 'always'
    || (settings?.showBaseStats === 'meta' && !legalLockedFormat(format));

  const geneticsKey = authPlayerKey === playerKey ? 'auth' : playerKey;
  const lockedVisibilities = settings?.lockGeneticsVisibility?.[geneticsKey] || [];

  const defaultShowBehavior = !lockedVisibilities?.length || [
    shouldShowBaseStats && 'base',
    'iv',
    !legacy && 'ev',
  ].filter(Boolean).every((
    k: 'base' | 'iv' | 'ev',
  ) => lockedVisibilities.includes(k));

  const showBaseRow = shouldShowBaseStats && (
    pokemon?.showGenetics
      || (!defaultShowBehavior && lockedVisibilities.includes('base'))
  );

  const showIvsRow = pokemon?.showGenetics
    || (!defaultShowBehavior && lockedVisibilities.includes('iv'));

  const showEvsRow = (!legacy || settings?.showLegacyEvs) && (
    pokemon?.showGenetics
      || (!defaultShowBehavior && lockedVisibilities.includes('ev'))
  );

  const hasDirtyBaseStats = Object.values(pokemon?.dirtyBaseStats || {})
    .some((n) => typeof n === 'number' && n > -1);

  const allowIllegalSpreads = settings?.allowIllegalSpreads === 'always'
    || (settings?.allowIllegalSpreads === 'meta' && !legalLockedFormat(format));

  const totalEvs = Object.values(pokemon?.evs || {}).reduce((sum, ev) => sum + (ev || 0), 0);
  const maxLegalEvs = env.int(format?.includes('random') ? 'calcdex-pokemon-max-legal-randoms-evs' : 'calcdex-pokemon-max-legal-evs');
  const transformedLegalEvs = pokemon?.transformedForme ? pokemon?.evs?.hp ?? 0 : 0;

  const defaultIv = React.useMemo(() => getDefaultSpreadValue('iv', format), [format]);
  const defaultEv = React.useMemo(() => getDefaultSpreadValue('ev', format), [format]);

  const pristineSpreadValue = React.useCallback((
    spread: 'iv' | 'ev',
    value: number,
  ) => (
    (value || 0) === (spread === 'ev' ? defaultEv : defaultIv)
  ), [
    defaultEv,
    defaultIv,
  ]);

  // update (2023/07/26): since showLegacyEvs is now a setting, any amount of EVs in legacy gens
  // will always be legal! (each stat defaults to 252 anyway, depending on the applied preset)
  const evsLegal = (legacy && settings?.showLegacyEvs)
    || allowIllegalSpreads
    || totalEvs <= maxLegalEvs + transformedLegalEvs;

  // should only apply the missingSpread styles if a Pokemon is loaded in
  const missingIvs = !!pokemon?.speciesForme && !Object.values(pokemon?.ivs || {}).reduce((sum, value) => sum + (value || 0), 0);
  const missingEvs = !!pokemon?.speciesForme && !legacy && !totalEvs;

  const warningColor = settings?.nhkoColors?.[2];
  const evsWarning = missingEvs
    || (!format?.includes('random') && totalEvs < maxLegalEvs)
    || !evsLegal;

  const statsRecord = React.useMemo(() => (pokemon?.speciesForme ? calcPokemonFinalStats(
    gen,
    pokemon,
    opponentPokemon,
    player,
    opponent,
    field,
    AllPlayerKeys.filter((k) => state[k]?.active).map((k) => state[k]),
  ) : null), [
    field,
    gen,
    opponent,
    opponentPokemon,
    player,
    pokemon,
    state,
  ]);

  const {
    stats: finalStats,
    ...statMods
  } = (statsRecord || {}) as typeof statsRecord;

  return (
    <TableGrid
      className={cx(
        styles.container,
        gen === 1 && styles.legacySpc,
        containerSize === 'xs' && styles.verySmol,
        ['md', 'lg', 'xl'].includes(containerSize) && styles.veryThicc,
        !!colorScheme && styles[colorScheme],
        className,
      )}
      style={style}
    >
      {/* table headers (horizontal) */}
      <TableGridItem align="right" header>
        <ToggleButton
          className={styles.small}
          label={pokemon?.showGenetics ? 'Hide' : 'Show'}
          tooltip={(
            <div className={styles.tooltipContent}>
              {pokemon?.showGenetics ? 'Hide' : 'Show'}{' '}
              {[
                shouldShowBaseStats && (defaultShowBehavior || !lockedVisibilities.includes('base')) && 'Base',
                (defaultShowBehavior || !lockedVisibilities.includes('iv')) && (legacy ? 'DVs' : 'IVs'),
                !legacy && (defaultShowBehavior || !lockedVisibilities.includes('ev')) && 'EVs',
              ].filter(Boolean).join('/')}
            </div>
          )}
          tooltipDisabled={!settings?.showUiTooltips}
          primary
          disabled={!pokemon?.speciesForme || missingIvs || missingEvs}
          onPress={() => updatePokemon({
            showGenetics: !pokemon.showGenetics,
          }, `${l.scope}:ToggleButton~Genetics:onPress()`)}
        />
      </TableGridItem>

      {statNames.map((stat) => {
        if (gen === 1 && stat === 'spd') {
          return null;
        }

        const boostUp = PokemonNatureBoosts[pokemon?.nature]?.[0] === stat;
        const boostDown = PokemonNatureBoosts[pokemon?.nature]?.[1] === stat;

        const statName = (gen === 1 && stat === 'spa' && 'spc') || stat;

        return (
          <TableGridItem
            key={`PokeStats:StatHeader:${pokemonKey}:${stat}`}
            className={cx(
              styles.header,
              styles.statHeader,
              boostUp && styles.up,
              boostDown && styles.down,
            )}
            header
          >
            {boostUp && '+'}
            {boostDown && '-'}
            {statName}
          </TableGridItem>
        );
      })}

      {/* base stats */}
      {
        showBaseRow &&
        <>
          <TableGridItem
            className={styles.header}
            align="right"
            header
          >
            <Button
              className={cx(
                styles.boostButton,
                styles.boostBaseStatButton,
                !hasDirtyBaseStats && styles.pristine,
                !hasDirtyBaseStats && styles.disabled, // intentionally keeping them separate
              )}
              labelClassName={styles.boostButtonLabel}
              label="Base"
              tooltip="Reset All Modified Base Stats"
              tooltipDisabled={!settings?.showUiTooltips || !hasDirtyBaseStats}
              highlight={hasDirtyBaseStats}
              hoverScale={1}
              absoluteHover
              disabled={!pokemon?.speciesForme || !hasDirtyBaseStats}
              onPress={() => updatePokemon({
                dirtyBaseStats: null,
              }, `${l.scope}:Button~DirtyBaseStats:onPress()`)}
            />
          </TableGridItem>

          {statNames.map((stat) => {
            const statLabel = stat.toUpperCase();

            const baseStat = pokemon?.dirtyBaseStats?.[stat] ?? (
              pokemon?.transformedForme && stat !== 'hp'
                ? pokemon.transformedBaseStats
                : pokemon?.baseStats
            )?.[stat] as number;

            const pristine = typeof pokemon?.dirtyBaseStats?.[stat] !== 'number';
            const disabled = !pokemon?.speciesForme;

            return (
              <TableGridItem
                key={`PokeStats:BaseStats:${pokemonKey}:${stat}`}
                className={styles.valueFieldContainer}
              >
                <ValueField
                  className={cx(
                    styles.valueField,
                    styles.baseStatField,
                    pristine && styles.pristine,
                    disabled && styles.disabled,
                  )}
                  inputClassName={cx(
                    styles.valueFieldInput,
                    pristine && styles.dim,
                  )}
                  label={`${statLabel} Base Stat for ${friendlyPokemonName}`}
                  hideLabel
                  hint={baseStat?.toString() || 1}
                  fallbackValue={1}
                  min={1}
                  max={999}
                  step={1}
                  shiftStep={10}
                  loop
                  loopStepsOnly
                  clearOnFocus
                  absoluteHover
                  input={{
                    value: baseStat,
                    onChange: (value: number) => updatePokemon({
                      dirtyBaseStats: { [stat]: value },
                    }, `${l.scope}:ValueField~Base-${statLabel}:input.onChange()`),
                  }}
                  disabled={disabled}
                />
              </TableGridItem>
            );
          })}
        </>
      }

      {/* IVs */}
      {
        showIvsRow &&
        <>
          <Tooltip
            content={missingIvs ? (
              <div className={styles.tooltipContent}>
                There are no {legacy ? 'DV' : 'IV'}s set!
              </div>
            ) : null}
            offset={[0, 10]}
            delay={[1000, 50]}
            trigger="mouseenter"
            touch={['hold', 500]}
            disabled={!missingIvs}
          >
            <TableGridItem
              className={cx(
                styles.header,
                missingIvs && styles.warning,
              )}
              style={missingIvs && warningColor ? { color: warningColor } : undefined}
              align="right"
              header
            >
              {legacy ? 'DV' : 'IV'}
              <span className={styles.small}>
                S
              </span>
            </TableGridItem>
          </Tooltip>

          {statNames.map((stat) => {
            if (gen === 1 && stat === 'spd') {
              return null;
            }

            const statName = gen === 1 && stat === 'spa' ? 'spc' : stat;
            const statLabel = statName.toUpperCase();

            const iv = pokemon?.ivs?.[stat] || 0;
            const value = legacy ? convertIvToLegacyDv(iv) : iv;
            const maxValue = legacy ? 15 : 31;

            const pristine = !missingIvs && pristineSpreadValue('iv', iv);
            const disabled = !pokemon?.speciesForme
              || (legacy && stat === 'hp')
              || (gen === 2 && stat === 'spd');

            return (
              <TableGridItem
                key={`PokeStats:Ivs:${pokemonKey}:${stat}`}
                className={styles.valueFieldContainer}
              >
                <ValueField
                  className={cx(
                    styles.valueField,
                    disabled && styles.disabled,
                    pristine && styles.pristine,
                  )}
                  inputClassName={cx(
                    styles.valueFieldInput,
                    pristine && styles.dim,
                    missingIvs && styles.warning,
                  )}
                  inputStyle={missingIvs && warningColor ? { color: warningColor } : undefined}
                  label={`${statLabel} ${legacy ? 'DV' : 'IV'} for ${friendlyPokemonName}`}
                  hideLabel
                  hint={value.toString() || maxValue.toString()}
                  fallbackValue={maxValue}
                  min={0}
                  max={legacy ? maxValue : (allowIllegalSpreads ? 999 : maxValue)}
                  step={1}
                  shiftStep={legacy ? 3 : 5}
                  loop
                  loopStepsOnly
                  clearOnFocus
                  absoluteHover
                  input={{
                    value,
                    onChange: (val: number) => updatePokemon({
                      // note: HP (for legacy gens) & SPD (for gen 2 only) handled in updatePokemon() of useCalcdexContext()
                      ivs: { [stat]: legacy ? convertLegacyDvToIv(val) : val },
                    }, `${l.scope}:ValueField~Iv-${statLabel}:input.onChange()`),
                  }}
                  disabled={disabled}
                />
              </TableGridItem>
            );
          })}
        </>
      }

      {/* EVs */}
      {
        showEvsRow &&
        <>
          <Tooltip
            content={totalEvs < maxLegalEvs || !evsLegal ? (
              <div className={styles.tooltipContent}>
                {missingEvs ? (
                  <>
                    There are no EVs set!
                  </>
                ) : (!format?.includes('random') && totalEvs < maxLegalEvs) ? (
                  <>
                    You have{' '}
                    <strong>{pluralize(maxLegalEvs - totalEvs, 'unallocated EV:s')}</strong>.
                  </>
                ) : (
                  <>
                    You have{' '}
                    <strong>{pluralize(totalEvs - maxLegalEvs, 'EV:s')}</strong>{' '}
                    over the legal limit of{' '}
                    <strong>{pluralize(maxLegalEvs, 'EV:s')}</strong>.
                  </>
                )}
              </div>
            ) : 'nice'}
            offset={[0, 10]}
            delay={[1000, 50]}
            trigger="mouseenter"
            touch={['hold', 500]}
            disabled={!evsWarning}
          >
            <TableGridItem
              className={cx(
                styles.header,
                evsWarning && styles.warning,
              )}
              style={evsWarning && warningColor ? { color: warningColor } : undefined}
              align="right"
              header
            >
              EV
              <span className={styles.small}>
                S
              </span>
            </TableGridItem>
          </Tooltip>

          {statNames.map((stat) => {
            const statLabel = stat.toUpperCase();
            const ev = pokemon?.evs?.[stat] || 0;

            const pristine = !missingEvs && pristineSpreadValue('ev', ev);
            const disabled = !pokemon?.speciesForme || (gen === 2 && stat === 'spd');

            return (
              <TableGridItem
                key={`PokeStats:Evs:${pokemonKey}:${stat}`}
                className={styles.valueFieldContainer}
              >
                <ValueField
                  className={cx(
                    styles.valueField,
                    pristine && styles.pristine,
                    disabled && styles.disabled,
                  )}
                  inputClassName={cx(
                    styles.valueFieldInput,
                    pristine && styles.dim,
                    missingEvs && styles.warning,
                  )}
                  inputStyle={missingEvs && warningColor ? { color: warningColor } : undefined}
                  label={`${statLabel} EV for ${friendlyPokemonName}`}
                  hideLabel
                  hint={ev.toString() || '252'}
                  fallbackValue={0}
                  min={0}
                  max={allowIllegalSpreads ? 999 : 252}
                  step={4}
                  shiftStep={16}
                  loop
                  loopStepsOnly
                  clearOnFocus
                  absoluteHover
                  input={{
                    value: ev,
                    onChange: (value: number) => updatePokemon({
                      evs: { [stat]: value },
                    }, `${l.scope}:ValueField~Ev-${statLabel}:input.onChange()`),
                  }}
                  disabled={disabled}
                />
              </TableGridItem>
            );
          })}
        </>
      }

      {/* calculated stats */}
      <TableGridItem align="right" header />

      {statNames.map((stat) => {
        const finalStat = finalStats?.[stat] || 0;
        const formattedStat = formatStatBoost(finalStat) || '???';
        const mods = statMods?.[stat];

        const boostDelta = detectStatBoostDelta(pokemon, finalStats, stat);
        const boostColor = (
          !!boostDelta
            && (settings?.nhkoColors?.length || 0) > 1
            && settings.nhkoColors[boostDelta === 'positive' ? 0 : (settings.nhkoColors.length - 1)]
        ) || null;

        return (
          <Tooltip
            key={`PokeStats:StatValue:${pokemonKey}:${stat}`}
            content={(
              <div className={styles.statModsTable}>
                {mods?.map((mod) => (
                  <React.Fragment
                    key={`PokeStats:StatMod:${pokemonKey}:${mod?.modifier || '?'}:${mod?.label || '?'}`}
                  >
                    <div
                      className={cx(
                        styles.statModValue,
                        styles.statValue,
                        (mod?.modifier ?? 1) > 1 && styles.positive,
                        (mod?.modifier ?? 1) < 1 && styles.negative,
                      )}
                    >
                      {(mod?.modifier ?? -1) >= 0 ? (
                        <>{mod.modifier.toFixed(2).replace(/(\.[1-9]+)?\.?0*$/, '$1')}&times;</>
                      ) : (mod?.swapped?.[1]?.toUpperCase?.() || null)}
                    </div>
                    <div className={styles.statModLabel}>
                      {mod?.label || '??? HUH'}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            )}
            offset={[0, 10]}
            delay={[1000, 50]}
            trigger="mouseenter"
            touch={['hold', 500]}
            disabled={!mods?.length}
          >
            <TableGridItem
              className={cx(
                styles.statValue,
                styles.finalStat,
                !!boostDelta && !boostColor && styles[boostDelta], // default color
              )}
              style={boostColor ? { color: boostColor } : undefined}
            >
              {formattedStat}
            </TableGridItem>
          </Tooltip>
        );
      })}

      {/* boosts */}
      <TableGridItem
        className={styles.header}
        align="right"
        header
      >
        Stage
      </TableGridItem>

      {/* this is used as a spacer since HP cannot be boosted, obviously! */}
      <TableGridItem />

      {boostNames.map((stat) => {
        const statLabel = stat.toUpperCase();
        const boost = pokemon?.dirtyBoosts?.[stat] ?? pokemon?.boosts?.[stat] ?? 0;
        const didDirtyBoost = typeof pokemon?.dirtyBoosts?.[stat] === 'number';

        return (
          <TableGridItem
            key={`PokeStats:Boosts:${pokemonKey}:${stat}`}
            className={styles.stageValue}
          >
            <Button
              labelClassName={styles.boostModButtonLabel}
              label="-"
              hoverScale={1}
              disabled={!pokemon?.speciesForme || boost <= -6}
              onPress={() => updatePokemon({
                dirtyBoosts: { [stat]: Math.max(boost - 1, -6) },
              }, `${l.scope}:Button~DirtyBoosts-${statLabel}-Minus:onPress()`)}
            />

            <Button
              className={cx(
                styles.boostButton,
                !didDirtyBoost && styles.pristine,
                !didDirtyBoost && styles.disabled, // intentionally keeping them separate
              )}
              labelClassName={styles.boostButtonLabel}
              label={`${boost > 0 ? '+' : ''}${boost}`}
              highlight={didDirtyBoost}
              hoverScale={1}
              absoluteHover
              disabled={!pokemon?.speciesForme || !didDirtyBoost}
              onPress={() => updatePokemon({
                // resets the dirty boost, in which a re-render will re-sync w/
                // the actual boost from the battle state
                dirtyBoosts: { [stat]: null },
              }, `${l.scope}:Button~DirtyBoosts-${statLabel}-Reset:onPress()`)}
            />

            <Button
              labelClassName={styles.boostModButtonLabel}
              label="+"
              hoverScale={1}
              disabled={!pokemon?.speciesForme || boost >= 6}
              onPress={() => updatePokemon({
                dirtyBoosts: { [stat]: Math.min(boost + 1, 6) },
              }, `${l.scope}:Button~DirtyBoosts-${statLabel}-Plus:onPress()`)}
            />
          </TableGridItem>
        );
      })}
    </TableGrid>
  );
};
