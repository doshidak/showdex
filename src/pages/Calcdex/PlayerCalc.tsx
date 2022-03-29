import * as React from 'react';
import cx from 'classnames';
import { PiconButton, useColorScheme } from '@showdex/components/app';
import { Button } from '@showdex/components/ui';
import { openShowdownUser } from '@showdex/utils/app';
import type { Generation } from '@pkmn/data';
import type { GenerationNum } from '@pkmn/types';
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
  dex?: Generation;
  gen?: GenerationNum;
  format?: string;
  playerKey?: CalcdexPlayerKey;
  player: CalcdexPlayer;
  opponent: CalcdexPlayer;
  field?: CalcdexBattleField;
  defaultName?: string;
  onPokemonChange?: (pokemon: Partial<CalcdexPokemon>) => void;
  onIndexSelect?: (index: number) => void;
  onAutoSelectChange?: (autoSelect: boolean) => void;
}

export const PlayerCalc = ({
  className,
  style,
  dex,
  gen,
  format,
  playerKey = 'p1',
  player,
  opponent,
  field,
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
          {/* <div className={styles.username}>
            {name || defaultName}
          </div> */}

          <Button
            className={styles.usernameButton}
            labelClassName={styles.usernameButtonLabel}
            label={name || defaultName}
            tooltip="Open User Profile"
            absoluteHover
            disabled={!name}
            onPress={() => openShowdownUser(name)}
          />

          <div>
            <Button
              labelClassName={cx(
                styles.toggleButtonLabel,
                !autoSelect && styles.inactive,
              )}
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
              <PiconButton
                key={`PlayerCalc:Picon:${playerKey}:${mon?.calcdexId || mon?.ident || defaultName}:${i}`}
                className={cx(
                  styles.piconButton,
                  !!activePokemon?.calcdexId && (activePokemon?.calcdexId === mon?.calcdexId) && styles.active,
                  !!playerPokemon?.calcdexId && (playerPokemon?.calcdexId === mon?.calcdexId) && styles.selected,
                  (mon?.fainted || !mon?.hp) && styles.fainted,
                )}
                piconClassName={styles.picon}
                display="block"
                aria-label={`Select ${mon?.name || mon?.speciesForme || mon?.ident}`}
                pokemon={mon ? {
                  ...mon,
                  item: mon?.dirtyItem ?? mon?.item,
                } : 'pokeball-none'}
                tooltip={mon?.speciesForme || mon?.name || mon?.ident} /** @todo make this more descriptive, like the left-half of PokeInfo */
                disabled={!mon}
                onPress={() => onIndexSelect?.(i)}
              >
                <div className={styles.background} />
              </PiconButton>
            );
          })}
        </div>
      </div>

      <PokeCalc
        className={styles.pokeCalc}
        dex={dex}
        gen={gen}
        format={format}
        playerPokemon={playerPokemon}
        opponentPokemon={opponentPokemon}
        field={{
          ...field,
          attackerSide: playerSideId === playerKey ? field?.attackerSide : field?.defenderSide,
          defenderSide: playerSideId === playerKey ? field?.defenderSide : field?.attackerSide,
        }}
        onPokemonChange={onPokemonChange}
      />
    </div>
  );
};
