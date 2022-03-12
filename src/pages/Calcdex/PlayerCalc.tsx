import * as React from 'react';
import cx from 'classnames';
import { Picon } from '@showdex/components/app';
import { BaseButton } from '@showdex/components/ui';
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
}: PlayerCalcProps): JSX.Element => {
  const {
    sideid: playerSideId,
    name,
    rating,
    pokemon,
    activeIndex,
    selectionIndex: playerIndex,
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
      className={cx(styles.container, className)}
      style={style}
    >
      <div className={styles.playerBar}>
        <div className={styles.username}>
          {name || defaultName}

          {
            !!rating &&
            <>
              <br />
              <span style={{ fontSize: 8, opacity: 0.5 }}>
                ELO{' '}
                {rating}
              </span>
            </>
          }
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
                hoverScale={1.175}
                disabled={!mon}
                onPress={() => onIndexSelect?.(i)}
              >
                <Picon
                  className={styles.picon}
                  pokemon={mon || 'pokeball-none'}
                />

                <div className={styles.background} />
              </BaseButton>
            );
          })}
        </div>
      </div>

      <PokeCalc
        style={{ paddingTop: 15 }}
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
