import * as React from 'react';
import cx from 'classnames';
import { PiconButton } from '@showdex/components/app';
import { type DropdownOption } from '@showdex/components/form';
import { type CalcdexPlayerKey } from '@showdex/interfaces/calc';
import { useColorScheme } from '@showdex/redux/store';
import { calcPokemonCurrentHp } from '@showdex/utils/calc';
import { env, formatId } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { hasNickname } from '@showdex/utils/dex';
import { CalcdexPokeProvider } from '../CalcdexPokeContext';
import { useCalcdexContext } from '../CalcdexContext';
import { PlayerInfo } from '../PlayerInfo';
import { PokeCalc } from '../PokeCalc';
import styles from './PlayerCalc.module.scss';

export interface PlayerCalcProps {
  className?: string;
  style?: React.CSSProperties;
  position?: 'top' | 'bottom';
  playerKey?: CalcdexPlayerKey;
  defaultName?: string;
  playerOptions?: DropdownOption<CalcdexPlayerKey>[];
}

const l = logger('@showdex/components/calc/PlayerCalc');

export const PlayerCalc = ({
  className,
  style,
  position = 'top',
  playerKey = 'p1',
  defaultName = '--',
  playerOptions,
}: PlayerCalcProps): JSX.Element => {
  const colorScheme = useColorScheme();

  const {
    state,
    settings,
    selectPokemon,
  } = useCalcdexContext();

  const {
    operatingMode,
    containerSize,
    legacy,
  } = state;

  const minPokemonKey = (operatingMode === 'battle' && 'calcdex-player-min-pokemon')
    || (operatingMode === 'standalone' && 'honkdex-player-min-pokemon')
    || null;

  const minPokemon = (!!minPokemonKey && env.int(minPokemonKey)) || 0;

  const {
    pokemon: playerParty,
    maxPokemon,
    selectionIndex: playerIndex,
  } = state[playerKey] || {};

  const playerPokemon = playerParty?.[playerIndex];

  return (
    <div
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        containerSize === 'xs' && styles.verySmol,
        ['md', 'lg', 'xl'].includes(containerSize) && styles.thicc,
        operatingMode === 'standalone' && styles.standalone,
        className,
      )}
      style={style}
    >
      <div className={styles.playerBar}>
        {
          operatingMode === 'battle' &&
          <PlayerInfo
            className={styles.playerInfo}
            position={position}
            playerKey={playerKey}
            defaultName={defaultName}
            playerOptions={playerOptions}
          />
        }

        <div className={styles.teamList}>
          {Array(Math.max(maxPokemon || 0, minPokemon)).fill(null).map((_, i) => {
            const pokemon = playerParty?.[i];

            const pokemonKey = pokemon?.calcdexId
              || pokemon?.ident
              || pokemon?.searchid
              || pokemon?.details
              || pokemon?.name
              || pokemon?.speciesForme
              || String(i);

            const friendlyPokemonName = pokemon?.speciesForme
              || pokemon?.name
              || pokemonKey;

            const nickname = hasNickname(pokemon) && settings?.showNicknames
              ? pokemon.name
              : null;

            const speciesForme = pokemon?.speciesForme; // don't show transformedForme here, as requested by camdawgboi
            const hp = calcPokemonCurrentHp(pokemon);
            const ability = pokemon?.dirtyAbility || pokemon?.ability;
            const item = pokemon?.dirtyItem ?? pokemon?.item;

            // only tracking Ruin abilities (gen 9) atm
            const abilityActive = !legacy
              && formatId(ability)?.endsWith('ofruin')
              && pokemon.abilityToggled;

            const pokemonActive = !!pokemon?.calcdexId
              && pokemon.active;

            const pokemonSelected = (
              operatingMode === 'standalone'
                && (playerIndex ?? -1) > -1
                && i === playerIndex
            ) || (
              !!pokemon?.calcdexId
                && !!playerPokemon?.calcdexId
                && playerPokemon.calcdexId === pokemon.calcdexId
            );

            const disabled = (
              operatingMode === 'battle'
                && !pokemon?.speciesForme
            );

            return (
              <PiconButton
                key={`PlayerCalc:Picon:${playerKey}:${pokemonKey}`}
                className={cx(
                  styles.piconButton,
                  pokemonActive && styles.active,
                  pokemonSelected && styles.selected,
                  !hp && styles.fainted,
                )}
                piconClassName={cx(
                  styles.picon,
                  !pokemon?.speciesForme && styles.none,
                )}
                display="block"
                aria-label={`Select ${friendlyPokemonName}`}
                pokemon={pokemon?.speciesForme ? {
                  ...pokemon,
                  speciesForme: speciesForme?.replace(pokemon?.useMax ? '' : '-Gmax', ''),
                  item,
                } : 'pokeball-none'}
                tooltip={pokemon ? (
                  <div className={styles.piconTooltip}>
                    {nickname ? (
                      <>
                        {nickname}{' '}
                        (<strong>{friendlyPokemonName}</strong>)
                      </>
                    ) : <strong>{friendlyPokemonName}</strong>}

                    {
                      abilityActive &&
                      <>
                        <br />
                        <span className={styles.activeAbility}>
                          {ability}
                        </span>
                      </>
                    }

                    {
                      !!item &&
                      <>
                        <br />
                        {item}
                      </>
                    }

                    {
                      (!pokemon?.dirtyItem && !!pokemon?.prevItem) &&
                      <>
                        <br />
                        <span className={styles.prevItem}>
                          {pokemon.prevItem}
                        </span>
                      </>
                    }
                  </div>
                ) : undefined}
                disabled={disabled}
                onPress={() => selectPokemon(
                  playerKey,
                  i,
                  `${l.scope}:PiconButton~SelectionIndex:onPress()`,
                )}
              >
                <div className={styles.piconBackground} />

                {
                  (operatingMode === 'standalone' && !pokemon?.speciesForme) &&
                  <div className={styles.piconAdd}>
                    <i className="fa fa-plus" />
                  </div>
                }
              </PiconButton>
            );
          })}
        </div>
      </div>

      <CalcdexPokeProvider playerKey={playerKey}>
        <PokeCalc
          className={styles.pokeCalc}
        />
      </CalcdexPokeProvider>
    </div>
  );
};
