import * as React from 'react';
import cx from 'classnames';
import { Picon, useColorScheme } from '@showdex/components/app';
import { BaseButton, Button } from '@showdex/components/ui';
import type { Generation, GenerationNum } from '@pkmn/data';
import type {
  CalcdexBattleField,
  CalcdexPlayer,
  CalcdexPlayerKey,
  CalcdexPokemon,
} from './CalcdexReducer';
import { PokeCalc } from './PokeCalc';
import styles from './PlayerCalc.module.scss';

interface PlayerCalcProps {
  className?: string;
  style?: React.CSSProperties;
  // format?: string;
  playerKey?: CalcdexPlayerKey;
  player: CalcdexPlayer;
  opponent: CalcdexPlayer;
  field?: CalcdexBattleField;
  gen?: GenerationNum;
  dex?: Generation;
  defaultName?: string;
  onPokemonChange?: (pokemon: Partial<CalcdexPokemon>) => void;
  onIndexSelect?: (index: number) => void;
  onAutoSelectChange?: (autoSelect: boolean) => void;
}

export const PlayerCalc = ({
  className,
  style,
  // format,
  playerKey = 'p1',
  player,
  opponent,
  field,
  gen,
  dex,
  defaultName = '--',
  onPokemonChange,
  onIndexSelect,
  onAutoSelectChange,
}: PlayerCalcProps): JSX.Element => {
  const colorScheme = useColorScheme();

  const {
    sideid: playerSideId,
    name,
    rating,
    pokemon,
    activeIndex,
    selectionIndex: playerIndex,
    autoSelect,
  } = player || {};

  const {
    // sideid: opponentSideId,
    pokemon: opponentPokemons,
    selectionIndex: opponentIndex,
  } = opponent || {};

  const activePokemon = pokemon[activeIndex];
  const playerPokemon = pokemon[playerIndex];
  const opponentPokemon = opponentPokemons[opponentIndex];

  return (
    <div
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        className,
      )}
      style={style}
    >
      <div className={styles.playerBar}>
        <div className={styles.playerInfo}>
          <div className={styles.username}>
            {name || defaultName}

            {/*
              !!rating &&
              <>
                <br />
                <span style={{ fontSize: 8, opacity: 0.5 }}>
                  ELO{' '}
                  {rating}
                </span>
              </>
            */}
          </div>

          <div>
            <Button
              labelStyle={{
                fontSize: 8,
                color: autoSelect ? undefined : '#FFFFFF',
                textTransform: 'uppercase',
              }}
              label="Auto"
              tooltip={`${autoSelect ? 'Manually ' : 'Auto-'}Select Active Pokémon`}
              absoluteHover
              disabled={!pokemon?.length}
              onPress={() => onAutoSelectChange?.(!autoSelect)}
            />

            {
              !!rating &&
              <span style={{ fontSize: 8, opacity: 0.5 }}>
                <span style={{ userSelect: 'none' }}>
                  {' '}&bull;{' '}
                  ELO{' '}
                </span>

                {rating}
              </span>
            }
          </div>
        </div>

        <div className={styles.teamList}>
          {Array(6).fill(null).map((_, i) => {
            const mon = pokemon?.[i];

            return (
              <BaseButton
                key={`Picon-${mon?.calcdexId || mon?.ident || defaultName}:${i}`}
                className={cx(
                  styles.piconButton,
                  !!activePokemon?.calcdexId && (activePokemon?.calcdexId === mon?.calcdexId) && styles.active,
                  !!playerPokemon?.calcdexId && (playerPokemon?.calcdexId === mon?.calcdexId) && styles.selected,
                  (mon?.fainted || !mon?.hp) && styles.fainted,
                )}
                aria-label={`Select ${mon?.name || mon?.speciesForme || mon?.ident}`}
                // hoverScale={1.175}
                hoverScale={1.1}
                disabled={!mon}
                onPress={() => onIndexSelect?.(i)}
              >
                <Picon
                  className={styles.picon}
                  pokemon={mon ? {
                    ...mon,
                    item: mon?.dirtyItem ?? mon?.item,
                  } : 'pokeball-none'}
                />

                <div className={styles.background} />
              </BaseButton>
            );
          })}
        </div>
      </div>

      <PokeCalc
        className={styles.pokeCalc}
        // style={{ paddingTop: 15 }}
        // format={format}
        playerPokemon={playerPokemon}
        opponentPokemon={opponentPokemon}
        field={{
          ...field,
          attackerSide: playerSideId === playerKey ? field?.attackerSide : field?.defenderSide,
          defenderSide: playerSideId === playerKey ? field?.defenderSide : field?.attackerSide,
        }}
        gen={gen}
        dex={dex}
        onPokemonChange={onPokemonChange}
      />

      {/* <pre>active: {serializePokemon(active?.[0], true)}</pre> */}
    </div>
  );
};
