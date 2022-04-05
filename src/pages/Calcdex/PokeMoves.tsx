import * as React from 'react';
import cx from 'classnames';
import { PokeType, useColorScheme } from '@showdex/components/app';
import { Dropdown } from '@showdex/components/form';
import { TableGrid, TableGridItem } from '@showdex/components/layout';
import { Button } from '@showdex/components/ui';
import { getMaxMove, getZMove } from '@showdex/utils/app';
import type { Generation, MoveName } from '@pkmn/data';
import type { GenerationNum } from '@pkmn/types';
import type { CalcdexPokemon } from './CalcdexReducer';
import type { SmogonMatchupHookCalculator } from './useSmogonMatchup';
import { createSmogonMove } from './createSmogonMove';
import styles from './PokeMoves.module.scss';

export interface PokeMovesProps {
  className?: string;
  style?: React.CSSProperties;
  dex: Generation;
  gen: GenerationNum;
  pokemon: CalcdexPokemon;
  movesCount?: number;
  calculateMatchup: SmogonMatchupHookCalculator;
  onPokemonChange?: (pokemon: Partial<CalcdexPokemon>) => void;
}

export const PokeMoves = ({
  className,
  style,
  dex,
  gen,
  pokemon,
  movesCount = 4,
  calculateMatchup,
  onPokemonChange,
}: PokeMovesProps): JSX.Element => {
  const colorScheme = useColorScheme();

  // const gen = dex?.num; // this is undefined lmao

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
      <TableGridItem
        className={styles.movesHeader}
        align="left"
        header
      >
        Moves

        {
          (gen === 7 || gen === 8) &&
          <>
            {' '}
            <Button
              className={styles.toggleButton}
              labelClassName={cx(
                styles.toggleButtonLabel,
                !pokemon?.useUltimateMoves && styles.inactive,
              )}
              label={gen === 7 ? 'Z-PWR' : 'Max'}
              tooltip={`${pokemon?.useUltimateMoves ? 'Deactivate' : 'Activate'} ${gen === 7 ? 'Z' : 'Max'} Moves`}
              // absoluteHover
              disabled={!pokemon}
              onPress={() => onPokemonChange?.({
                useUltimateMoves: !pokemon?.useUltimateMoves,
              })}
            />
          </>
        }
      </TableGridItem>

      <TableGridItem
        className={styles.dmgHeader}
        header
      >
        DMG

        {' '}
        <Button
          className={styles.toggleButton}
          labelClassName={cx(
            styles.toggleButtonLabel,
            !pokemon?.criticalHit && styles.inactive,
          )}
          label="Crit"
          tooltip={`${pokemon?.criticalHit ? 'Hide' : 'Show'} Critical Hit Damages`}
          // absoluteHover
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

        // if (pokemon?.useUltimateMoves) {
        //   const ultName = gen === 7 ?
        //     getZMove(dex, moveName, pokemon?.dirtyItem ?? pokemon?.item) :
        //     getMaxMove(dex, moveName, pokemon?.dirtyAbility ?? pokemon?.ability, pokemon?.rawSpeciesForme);
        //
        //   if (ultName) {
        //     moveName = ultName;
        //   }
        // }

        // const maxPp = move?.noPPBoosts ? (move?.pp || 0) : Math.floor((move?.pp || 0) * (8 / 5));
        // const remainingPp = Math.max(maxPp - (ppUsed || maxPp), 0);

        const calculatorMove = createSmogonMove(
          gen,
          pokemon,
          moveName,
        );

        const result = calculateMatchup?.(calculatorMove);

        // Z/Max/G-Max moves bypass the original move's accuracy
        // (only time these moves can "miss" is if the opposing Pokemon is in a semi-vulnerable state,
        // after using moves like Fly, Dig, Phantom Force, etc.)
        const showAccuracy = !pokemon?.useUltimateMoves &&
          typeof move?.accuracy !== 'boolean' &&
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
                tooltip={calculatorMove?.type ? (
                  <div className={styles.moveTooltip}>
                    <PokeType type={calculatorMove.type} />

                    {
                      !!calculatorMove.category &&
                      <>
                        <span className={styles.label}>
                          {' '}{calculatorMove.category.slice(0, 4)}{' '}
                        </span>
                        {calculatorMove?.bp || null}
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
                      !!calculatorMove?.priority &&
                      <>
                        <span className={styles.label}>
                          {' '}PRI{' '}
                        </span>
                        {calculatorMove.priority > 0 ? `+${calculatorMove.priority}` : calculatorMove.priority}
                      </>
                    }
                  </div>
                ) : null}
                input={{
                  name: `PokeMoves:MoveTrack:Move:${pokemonKey}:${i}`,
                  value: moveName,
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
                options={[pokemon?.useUltimateMoves && {
                  label: gen === 7 ? 'Z' : 'Max',
                  options: pokemon.moves.map((name) => {
                    const ultName = gen === 7 ?
                      getZMove(dex, name, pokemon?.dirtyItem ?? pokemon?.item) :
                      getMaxMove(dex, name, pokemon?.dirtyAbility ?? pokemon?.ability, pokemon?.rawSpeciesForme);

                    if (ultName) {
                      return { label: ultName, value: name };
                    }

                    return null;
                  }).filter(Boolean),
                }, !!pokemon?.moveState?.revealed.length && {
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
