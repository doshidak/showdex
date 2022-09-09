import * as React from 'react';
import cx from 'classnames';
import { useColorScheme } from '@showdex/components/app';
import { ValueField } from '@showdex/components/form';
import { TableGrid, TableGridItem } from '@showdex/components/layout';
import { Button } from '@showdex/components/ui';
import {
  PokemonBoostNames,
  PokemonNatureBoosts,
  PokemonStatNames,
} from '@showdex/consts';
import { detectStatBoostDelta, formatStatBoost } from '@showdex/utils/battle';
import { calcPokemonFinalStats } from '@showdex/utils/calc';
import { env } from '@showdex/utils/core';
import type { Generation } from '@pkmn/data';
import type { CalcdexBattleField, CalcdexPlayerKey, CalcdexPokemon } from '@showdex/redux/store';
import styles from './PokeStats.module.scss';

export interface PokeStatsProps {
  className?: string;
  style?: React.CSSProperties;
  dex: Generation;
  playerPokemon: CalcdexPokemon;
  opponentPokemon: CalcdexPokemon;
  field?: CalcdexBattleField;
  playerKey?: CalcdexPlayerKey,
  onPokemonChange?: (pokemon: DeepPartial<CalcdexPokemon>) => void;
}

export const PokeStats = ({
  className,
  style,
  dex,
  playerPokemon: pokemon,
  opponentPokemon,
  field,
  playerKey,
  onPokemonChange,
}: PokeStatsProps): JSX.Element => {
  const colorScheme = useColorScheme();

  const pokemonKey = pokemon?.calcdexId || pokemon?.name || '???';
  const friendlyPokemonName = pokemon?.speciesForme || pokemon?.name || pokemonKey;

  const totalEvs = Object.values(pokemon?.evs || {}).reduce((sum, ev) => sum + (ev || 0), 0);
  const evsLegal = totalEvs <= env.int('calcdex-pokemon-max-legal-evs');

  const missingIvs = !Object.values(pokemon?.ivs || {}).reduce((sum, value) => sum + (value || 0), 0);
  const missingEvs = !totalEvs;

  const finalStats = React.useMemo(() => (pokemon?.calcdexId ? calcPokemonFinalStats(
    dex,
    pokemon,
    opponentPokemon,
    field,
    playerKey,
  ) : null), [
    dex,
    opponentPokemon,
    playerKey,
    pokemon,
    field,
  ]);

  return (
    <TableGrid
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        className,
      )}
      style={style}
    >
      {/* table headers (horizontal) */}
      <TableGridItem align="left" header />

      {PokemonStatNames.map((stat) => {
        const boostUp = PokemonNatureBoosts[pokemon?.nature]?.[0] === stat;
        const boostDown = PokemonNatureBoosts[pokemon?.nature]?.[1] === stat;

        return (
          <TableGridItem
            key={`PokeStats:StatHeader:${pokemonKey}:${stat}`}
            className={cx(
              styles.statHeader,
              boostUp && styles.up,
              boostDown && styles.down,
            )}
            header
          >
            {boostUp && '+'}
            {boostDown && '-'}
            {stat}
          </TableGridItem>
        );
      })}

      {/* IVs */}
      <TableGridItem
        className={cx(
          styles.ivsHeader,
          missingIvs && styles.missingSpread,
        )}
        align="right"
        header
      >
        IV
        <span className={styles.small}>
          S
        </span>
      </TableGridItem>

      {PokemonStatNames.map((stat) => {
        const iv = pokemon?.ivs?.[stat] || 0;

        return (
          <TableGridItem
            key={`PokeStats:Ivs:${pokemonKey}:${stat}`}
            className={styles.valueFieldContainer}
          >
            <ValueField
              className={styles.valueField}
              inputClassName={cx(
                styles.valueFieldInput,
                missingIvs && styles.missingSpread,
              )}
              label={`${stat.toUpperCase()} IV for Pokemon ${friendlyPokemonName}`}
              hideLabel
              hint={iv.toString() || '31'}
              fallbackValue={31}
              min={0}
              max={31}
              step={1}
              shiftStep={5}
              loop
              loopStepsOnly
              clearOnFocus
              absoluteHover
              input={{
                value: iv,
                onChange: (value: number) => onPokemonChange?.({
                  ivs: { [stat]: value },
                }),
              }}
            />
          </TableGridItem>
        );
      })}

      {/* EVs */}
      <TableGridItem
        className={cx(
          styles.evsHeader,
          missingEvs && styles.missingSpread,
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

      {PokemonStatNames.map((stat) => {
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
              label={`${stat.toUpperCase()} EV for Pokemon ${friendlyPokemonName}`}
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
            />
          </TableGridItem>
        );
      })}

      {/* calculated stats */}
      <TableGridItem align="right" header />

      {PokemonStatNames.map((stat) => {
        const finalStat = finalStats?.[stat] || 0;
        const formattedStat = formatStatBoost(finalStat) || '???';
        const boostDelta = detectStatBoostDelta(pokemon, finalStats, stat);

        return (
          <TableGridItem
            key={`PokeStats:StatValue:${pokemonKey}:${stat}`}
            className={cx(
              styles.statValue,
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
      <TableGridItem align="right" header>
        Stage
      </TableGridItem>

      <TableGridItem /> {/* this is used as a spacer since HP cannot be boosted, obviously! */}
      {PokemonBoostNames.map((stat) => {
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
              disabled={boost <= -6}
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
              label={[
                boost > 0 && '+',
                boost.toString(),
              ].filter(Boolean).join('')}
              absoluteHover
              disabled={!didDirtyBoost}
              onPress={() => onPokemonChange?.({
                // resets the dirty boost, in which a re-render will re-sync w/
                // the actual boost from the battle state
                dirtyBoosts: { [stat]: undefined },
              })}
            />

            <Button
              labelClassName={styles.boostModButtonLabel}
              label="+"
              disabled={boost >= 6}
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
