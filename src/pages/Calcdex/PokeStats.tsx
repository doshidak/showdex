import * as React from 'react';
import cx from 'classnames';
import { ValueField } from '@showdex/components/form';
import { TableGrid, TableGridItem } from '@showdex/components/layout';
import { Button, ToggleButton, Tooltip } from '@showdex/components/ui';
import {
  PokemonBoostNames,
  PokemonNatureBoosts,
  PokemonStatNames,
} from '@showdex/consts/pokemon';
import { useCalcdexSettings, useColorScheme } from '@showdex/redux/store';
import {
  detectLegacyGen,
  detectStatBoostDelta,
  formatStatBoost,
  legalLockedFormat,
} from '@showdex/utils/battle';
import { calcPokemonFinalStats, convertIvToLegacyDv, convertLegacyDvToIv } from '@showdex/utils/calc';
import { env } from '@showdex/utils/core';
import { pluralize } from '@showdex/utils/humanize';
import type { GenerationNum } from '@smogon/calc';
import type { CalcdexBattleField, CalcdexPlayerKey, CalcdexPokemon } from '@showdex/redux/store';
import type { ElementSizeLabel } from '@showdex/utils/hooks';
import styles from './PokeStats.module.scss';

export interface PokeStatsProps {
  className?: string;
  style?: React.CSSProperties;
  gen?: GenerationNum;
  format?: string;
  playerPokemon: CalcdexPokemon;
  opponentPokemon: CalcdexPokemon;
  field?: CalcdexBattleField;
  playerKey?: CalcdexPlayerKey;
  containerSize?: ElementSizeLabel;
  onPokemonChange?: (pokemon: DeepPartial<CalcdexPokemon>) => void;
}

export const PokeStats = ({
  className,
  style,
  gen,
  format,
  playerPokemon: pokemon,
  opponentPokemon,
  field,
  playerKey,
  containerSize,
  onPokemonChange,
}: PokeStatsProps): JSX.Element => {
  const settings = useCalcdexSettings();
  const colorScheme = useColorScheme();

  const legacy = detectLegacyGen(gen);

  const statNames = PokemonStatNames.filter((stat) => gen > 1 || stat !== 'spd');
  const boostNames = PokemonBoostNames.filter((stat) => gen > 1 || stat !== 'spd');

  const pokemonKey = pokemon?.calcdexId || pokemon?.name || '???';
  const friendlyPokemonName = pokemon?.speciesForme || pokemon?.name || pokemonKey;

  const totalEvs = Object.values(pokemon?.evs || {}).reduce((sum, ev) => sum + (ev || 0), 0);
  const maxLegalEvs = env.int('calcdex-pokemon-max-legal-evs');
  const transformedLegalEvs = pokemon?.transformedForme ? pokemon?.evs?.hp ?? 0 : 0;
  const evsLegal = !legalLockedFormat(format) || totalEvs <= maxLegalEvs + transformedLegalEvs;

  // should only apply the missingSpread styles if a Pokemon is loaded in
  const missingIvs = !!pokemon?.speciesForme && !Object.values(pokemon?.ivs || {}).reduce((sum, value) => sum + (value || 0), 0);
  const missingEvs = !!pokemon?.speciesForme && !totalEvs;

  const finalStats = React.useMemo(() => (pokemon?.speciesForme ? calcPokemonFinalStats(
    gen,
    pokemon,
    opponentPokemon,
    field,
    playerKey,
  ) : null), [
    field,
    gen,
    opponentPokemon,
    playerKey,
    pokemon,
  ]);

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
          label={pokemon?.showGenetics ? 'Hide' : 'Edit'}
          tooltip={(
            <div className={styles.tooltipContent}>
              {pokemon?.showGenetics ? 'Hide' : 'Edit'}{' '}
              {legacy ? 'DVs' : 'EVs/IVs'}
            </div>
          )}
          tooltipDisabled={!settings?.showUiTooltips}
          primary
          disabled={!pokemon?.speciesForme || missingIvs || missingEvs}
          onPress={() => onPokemonChange?.({
            showGenetics: !pokemon.showGenetics,
          })}
        />
      </TableGridItem>

      {statNames.map((stat) => {
        if (gen === 1 && stat === 'spd') {
          return null;
        }

        const boostUp = PokemonNatureBoosts[pokemon?.nature]?.[0] === stat;
        const boostDown = PokemonNatureBoosts[pokemon?.nature]?.[1] === stat;

        const statName = gen === 1 && stat === 'spa'
          ? 'spc'
          : stat;

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

      {/* IVs */}
      {
        pokemon?.showGenetics &&
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
                styles.ivsHeader,
                missingIvs && styles.missingSpread,
              )}
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

            const statName = gen === 1 && stat === 'spa'
              ? 'spc'
              : stat;

            const iv = pokemon?.ivs?.[stat] || 0;
            const value = legacy ? convertIvToLegacyDv(iv) : iv;

            const disabled = !pokemon?.speciesForme
              || (legacy && stat === 'hp') || (gen === 2 && stat === 'spd');

            return (
              <TableGridItem
                key={`PokeStats:Ivs:${pokemonKey}:${stat}`}
                className={styles.valueFieldContainer}
              >
                <ValueField
                  className={cx(
                    styles.valueField,
                    disabled && styles.disabled,
                  )}
                  inputClassName={cx(
                    styles.valueFieldInput,
                    missingIvs && styles.missingSpread,
                  )}
                  label={`${statName.toUpperCase()} ${legacy ? 'DV' : 'IV'} for ${friendlyPokemonName}`}
                  hideLabel
                  hint={value.toString() || (legacy ? '15' : '31')}
                  fallbackValue={legacy ? 15 : 31}
                  min={0}
                  max={legacy ? 15 : 31}
                  step={1}
                  shiftStep={legacy ? 3 : 5}
                  loop
                  loopStepsOnly
                  clearOnFocus
                  absoluteHover
                  input={{
                    value,
                    onChange: (val: number) => onPokemonChange?.({
                      // note: HP (for gen 1 and 2) and SPD (for gen 2 only) handled in
                      // handlePokemonChange() of PokeCalc
                      ivs: { [stat]: legacy ? convertLegacyDvToIv(val) : val },
                    }),
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
        (!legacy && pokemon?.showGenetics) &&
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
            disabled={!missingEvs && (format?.includes('random') || totalEvs === maxLegalEvs) && evsLegal}
          >
            <TableGridItem
              className={cx(
                styles.header,
                styles.evsHeader,
                missingEvs && styles.missingSpread,
                (!format?.includes('random') && totalEvs < maxLegalEvs) && styles.unallocated,
                !evsLegal && styles.illegal,
              )}
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
            const ev = pokemon?.evs?.[stat] || 0;

            return (
              <TableGridItem
                key={`PokeStats:Evs:${pokemonKey}:${stat}`}
                className={styles.valueFieldContainer}
              >
                <ValueField
                  className={styles.valueField}
                  inputClassName={cx(
                    styles.valueFieldInput,
                    missingEvs && styles.missingSpread,
                  )}
                  label={`${stat.toUpperCase()} EV for ${friendlyPokemonName}`}
                  hideLabel
                  hint={ev.toString() || '252'}
                  fallbackValue={0}
                  min={0}
                  max={252}
                  step={4}
                  shiftStep={16}
                  loop
                  loopStepsOnly
                  clearOnFocus
                  absoluteHover
                  input={{
                    value: ev,
                    onChange: (value: number) => onPokemonChange?.({
                      evs: { [stat]: value },
                    }),
                  }}
                  disabled={!pokemon?.speciesForme}
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
        const boostDelta = detectStatBoostDelta(pokemon, finalStats, stat);

        return (
          <TableGridItem
            key={`PokeStats:StatValue:${pokemonKey}:${stat}`}
            className={cx(
              styles.statValue,
              styles.finalStat,
              !!boostDelta && styles[boostDelta],
              // boostDelta === 'positive' && styles.positive,
              // boostDelta === 'negative' && styles.negative,
            )}
          >
            {formattedStat}
          </TableGridItem>
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

      <TableGridItem /> {/* this is used as a spacer since HP cannot be boosted, obviously! */}
      {boostNames.map((stat) => {
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
              onPress={() => onPokemonChange?.({
                dirtyBoosts: { [stat]: Math.max(boost - 1, -6) },
              })}
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
              onPress={() => onPokemonChange?.({
                // resets the dirty boost, in which a re-render will re-sync w/
                // the actual boost from the battle state
                dirtyBoosts: { [stat]: undefined },
              })}
            />

            <Button
              labelClassName={styles.boostModButtonLabel}
              label="+"
              hoverScale={1}
              disabled={!pokemon?.speciesForme || boost >= 6}
              onPress={() => onPokemonChange?.({
                dirtyBoosts: { [stat]: Math.min(boost + 1, 6) },
              })}
            />
          </TableGridItem>
        );
      })}
    </TableGrid>
  );
};
