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
import type { Generation } from '@pkmn/data';
import type { CalcdexPokemon } from './CalcdexReducer';
import { calcPokemonStats } from './calcPokemonStats';
import { detectStatBoostDelta } from './detectStatBoostDelta';
import { formatStatBoost } from './formatStatBoost';
import styles from './PokeStats.module.scss';

export interface PokeStatsProps {
  className?: string;
  style?: React.CSSProperties;
  dex: Generation;
  pokemon: CalcdexPokemon;
  onPokemonChange?: (pokemon: Partial<CalcdexPokemon>) => void;
}

export const PokeStats = ({
  className,
  style,
  dex,
  pokemon,
  onPokemonChange,
}: PokeStatsProps): JSX.Element => {
  const colorScheme = useColorScheme();

  const pokemonKey = pokemon?.calcdexId || pokemon?.name || '???';
  const friendlyPokemonName = pokemon?.speciesForme || pokemon?.name || pokemonKey;

  const calculatedStats = React.useMemo(
    () => (pokemon?.calcdexId ? calcPokemonStats(dex, pokemon) : null),
    [dex, pokemon],
  );

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
      <TableGridItem align="right" header>
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
              label={`${stat.toUpperCase()} IV for Pokemon ${friendlyPokemonName}`}
              hint={iv.toString() || '31'}
              min={0}
              max={31}
              step={1}
              input={{
                value: iv,
                onChange: (value: number) => onPokemonChange?.({
                  ivs: { [stat]: value },
                }),
              }}
              hideLabel
              absoluteHover
            />
          </TableGridItem>
        );
      })}

      {/* EVs */}
      <TableGridItem align="right" header>
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
              label={`${stat.toUpperCase()} EV for Pokemon ${friendlyPokemonName}`}
              hint={ev.toString() || '252'}
              min={0}
              max={252}
              step={4}
              input={{
                value: ev,
                onChange: (value: number) => onPokemonChange?.({
                  evs: { [stat]: value },
                }),
              }}
              hideLabel
              absoluteHover
            />
          </TableGridItem>
        );
      })}

      {/* calculated stats */}
      <TableGridItem align="right" header />

      {PokemonStatNames.map((stat) => {
        const calculatedStat = calculatedStats?.[stat] || 0;
        const formattedStat = formatStatBoost(calculatedStat) || '???';
        const boostDelta = detectStatBoostDelta(pokemon, stat);

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
              className={styles.boostButton}
              style={didDirtyBoost ? undefined : { color: 'inherit' }}
              labelStyle={didDirtyBoost ? undefined : { color: 'inherit' }}
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
