import * as React from 'react';
import cx from 'classnames';
import { PokeType, useColorScheme } from '@showdex/components/app';
import { Dropdown } from '@showdex/components/form';
import { TableGrid, TableGridItem } from '@showdex/components/layout';
import { Button } from '@showdex/components/ui';
import type { Generation, MoveName } from '@pkmn/data';
import type { CalcdexPokemon } from './CalcdexReducer';
import type { SmogonMatchupHookCalculator } from './useSmogonMatchup';
import { createSmogonMove } from './createSmogonMove';
import styles from './PokeMoves.module.scss';

export interface PokeMovesProps {
  className?: string;
  style?: React.CSSProperties;
  dex: Generation;
  pokemon: CalcdexPokemon;
  movesCount?: number;
  calculateMatchup: SmogonMatchupHookCalculator;
  onPokemonChange?: (pokemon: Partial<CalcdexPokemon>) => void;
}

export const PokeMoves = ({
  className,
  style,
  dex,
  pokemon,
  movesCount = 4,
  calculateMatchup,
  onPokemonChange,
}: PokeMovesProps): JSX.Element => {
  const colorScheme = useColorScheme();

  const gen = dex?.num ?? 8;

  const pokemonKey = pokemon?.calcdexId || pokemon?.name || '???';
  const friendlyPokemonName = pokemon?.speciesForme || pokemon?.name || pokemonKey;

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
      <TableGridItem align="left" header>
        Moves
      </TableGridItem>

      <TableGridItem header>
        DMG

        {' '}
        <Button
          className={styles.critButton}
          labelClassName={cx(
            styles.critButtonLabel,
            styles.toggleButtonLabel,
            !pokemon?.criticalHit && styles.inactive,
          )}
          label="Crit"
          tooltip={`${pokemon?.criticalHit ? 'Hide' : 'Show'} Critical Hit Damages`}
          absoluteHover
          disabled={!pokemon?.speciesForme}
          onPress={() => onPokemonChange?.({
            criticalHit: !pokemon?.criticalHit,
          })}
        />
      </TableGridItem>

      <TableGridItem header>
        %KO
      </TableGridItem>

      {/* (actual) moves */}
      {Array(movesCount).fill(null).map((_, i) => {
        const moveid = pokemon?.moves?.[i];
        const move = moveid ? dex?.moves?.get?.(moveid) : null;

        const transformed = !!moveid && moveid?.charAt(0) === '*'; // moves used by a transformed Ditto
        const moveName = (transformed ? moveid.substring(1) : moveid) as MoveName;

        // const maxPp = move?.noPPBoosts ? (move?.pp || 0) : Math.floor((move?.pp || 0) * (8 / 5));
        // const remainingPp = Math.max(maxPp - (ppUsed || maxPp), 0);

        const calculatorMove = createSmogonMove(
          gen,
          moveName,
          pokemon?.criticalHit,
        );

        const result = calculateMatchup?.(calculatorMove);

        const showAccuracy = typeof move?.accuracy !== 'boolean' &&
          (move?.accuracy || -1) > 0 &&
          move.accuracy !== 100;

        // const showMoveStats = !!move?.type;

        return (
          <React.Fragment
            key={`PokeMoves:MoveTrack:${pokemonKey}:${moveName || '???'}:${i}`}
          >
            <TableGridItem align="left">
              <Dropdown
                aria-label={`Move Slot ${i + 1} for Pokemon ${friendlyPokemonName}`}
                hint="--"
                tooltip={move?.type ? (
                  <div className={styles.moveTooltip}>
                    <PokeType type={move.type} />

                    {
                      !!move.category &&
                      <>
                        <span className={styles.label}>
                          {' '}{move.category.slice(0, 4)}{' '}
                        </span>
                        {move.basePower || null}
                      </>
                    }

                    {
                      showAccuracy &&
                      <>
                        <span className={styles.label}>
                          {' '}ACC{' '}
                        </span>
                        {move.accuracy}%
                      </>
                    }

                    {
                      !!move?.priority &&
                      <>
                        <span className={styles.label}>
                          {' '}PRI{' '}
                        </span>
                        {move.priority > 0 ? `+${move.priority}` : move.priority}
                      </>
                    }
                  </div>
                ) : null}
                input={{
                  name: `PokeMoves:MoveTrack:Move:${pokemonKey}:${i}`,
                  value: pokemon?.moves?.[i],
                  onChange: (newMove: MoveName) => {
                    const moves = [...(pokemon?.moves || [] as MoveName[])];

                    if (!Array.isArray(moves) || (moves?.[i] && moves[i] === newMove)) {
                      return;
                    }

                    moves[i] = newMove;

                    onPokemonChange?.({
                      moves,
                    });
                  },
                }}
                options={[!!pokemon?.moveState?.revealed.length && {
                  label: 'Revealed',
                  options: pokemon.moveState.revealed.map((name) => ({ label: name, value: name })),
                }, !!pokemon?.altMoves?.length && {
                  label: 'Pool',
                  options: pokemon.altMoves
                    .filter((n) => !!n && (!pokemon.moveState?.revealed?.length || !pokemon.moveState.revealed.includes(n)))
                    .map((name) => ({ label: name, value: name })),
                }, !!pokemon?.moveState?.learnset.length && {
                  label: 'Learnset',
                  options: pokemon.moveState.learnset.map((name) => ({ label: name, value: name })),
                }, !!pokemon?.moveState?.other.length && {
                  label: 'All',
                  options: pokemon.moveState.other.map((name) => ({ label: name, value: name })),
                }].filter(Boolean)}
                noOptionsMessage="No Moves Found"
                disabled={!pokemon?.speciesForme}
              />
            </TableGridItem>

            <TableGridItem
              style={!result?.damageRange ? { opacity: 0.5 } : undefined}
            >
              {/* XXX.X% &ndash; XXX.X% */}
              {result?.damageRange}
            </TableGridItem>

            <TableGridItem
              style={{
                ...(!result?.koChance ? { opacity: 0.3 } : null),
                ...(result?.koColor ? { color: result.koColor } : null),
              }}
            >
              {/* XXX% XHKO */}
              {result?.koChance}
            </TableGridItem>
          </React.Fragment>
        );
      })}
    </TableGrid>
  );
};
