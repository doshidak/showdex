import * as React from 'react';
import cx from 'classnames';
import { PiconButton } from '@showdex/components/app';
import { Button, ToggleButton } from '@showdex/components/ui';
import { eacute } from '@showdex/consts/core';
import { useCalcdexSettings, useColorScheme } from '@showdex/redux/store';
import { openUserPopup } from '@showdex/utils/app';
import { hasNickname } from '@showdex/utils/battle';
// import { env } from '@showdex/utils/core';
import type { GenerationNum } from '@smogon/calc';
import type {
  CalcdexBattleField,
  CalcdexBattleRules,
  CalcdexPlayer,
  CalcdexPlayerKey,
  CalcdexPokemon,
} from '@showdex/redux/store';
import { PokeCalc } from './PokeCalc';
import styles from './PlayerCalc.module.scss';

interface PlayerCalcProps {
  className?: string;
  style?: React.CSSProperties;
  gen?: GenerationNum;
  format?: string;
  rules?: CalcdexBattleRules;
  playerKey?: CalcdexPlayerKey;
  player: CalcdexPlayer;
  opponent: CalcdexPlayer;
  field?: CalcdexBattleField;
  defaultName?: string;
  inBattle?: boolean;
  onPokemonChange?: (playerKey: CalcdexPlayerKey, pokemon: DeepPartial<CalcdexPokemon>) => void;
  onIndexSelect?: (index: number) => void;
  onAutoSelectChange?: (autoSelect: boolean) => void;
}

export const PlayerCalc = ({
  className,
  style,
  gen,
  format,
  rules,
  playerKey = 'p1',
  player,
  opponent,
  field,
  defaultName = '--',
  inBattle,
  onPokemonChange,
  onIndexSelect,
  onAutoSelectChange,
}: PlayerCalcProps): JSX.Element => {
  const settings = useCalcdexSettings();
  const colorScheme = useColorScheme();

  const {
    sideid: playerSideId,
    name,
    rating,
    pokemon,
    // pokemonOrder,
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
          <Button
            className={styles.usernameButton}
            labelClassName={styles.usernameButtonLabel}
            label={name || defaultName}
            tooltip={(
              <div className={styles.tooltipContent}>
                Open{' '}
                {name ? (
                  <>
                    <strong>{name}</strong>'s
                  </>
                ) : 'User'}{' '}
                Profile
              </div>
            )}
            tooltipDisabled={!settings?.showUiTooltips}
            absoluteHover
            disabled={!name}
            onPress={() => openUserPopup(name)}
          />

          <div className={styles.playerActions}>
            <ToggleButton
              className={styles.toggleButton}
              label="Auto"
              tooltip={`${autoSelect ? 'Manually ' : 'Auto-'}Select Pok${eacute}mon`}
              tooltipDisabled={!settings?.showUiTooltips}
              absoluteHover
              active={autoSelect}
              disabled={!pokemon?.length}
              onPress={() => onAutoSelectChange?.(!autoSelect)}
            />

            {
              (settings?.showPlayerRatings && !!rating) &&
              <div className={styles.rating}>
                <span className={styles.ratingSeparator}>
                  &bull;
                </span>

                {rating} ELO
              </div>
            }
          </div>
        </div>

        <div
          className={styles.teamList}
          style={{ gridTemplateColumns: `repeat(${inBattle ? 6 : 12}, min-content)` }}
        >
          {Array(player?.maxPokemon || 0).fill(null).map((_, i) => {
            const mon = pokemon?.[i];

            const pokemonKey = mon?.calcdexId
              || mon?.ident
              || mon?.searchid
              || mon?.details
              || mon?.name
              || mon?.speciesForme
              || defaultName
              || '???';

            const friendlyPokemonName = mon?.speciesForme
              || mon?.name
              || pokemonKey;

            const nickname = hasNickname(mon) && settings?.showNicknames
              ? mon.name
              : null;

            // const speciesForme = mon?.transformedForme || mon?.speciesForme;
            const speciesForme = mon?.speciesForme; // don't show transformedForme here, as requested by camdawgboi
            const item = mon?.dirtyItem ?? mon?.item;

            const pokemonActive = !!mon?.calcdexId
              && !!activePokemon?.calcdexId
              && activePokemon.calcdexId === mon.calcdexId;

            const pokemonSelected = !!mon?.calcdexId
              && !!playerPokemon?.calcdexId
              && playerPokemon.calcdexId === mon.calcdexId;

            return (
              <PiconButton
                key={`PlayerCalc:Picon:${playerKey}:${pokemonKey}:${i}`}
                className={cx(
                  styles.piconButton,
                  pokemonActive && styles.active,
                  pokemonSelected && styles.selected,
                  !mon?.hp && styles.fainted,
                )}
                piconClassName={styles.picon}
                display="block"
                aria-label={`Select ${friendlyPokemonName}`}
                pokemon={mon ? {
                  ...mon,
                  speciesForme: speciesForme?.replace(mon?.useMax ? '' : '-Gmax', ''),
                  item,
                } : 'pokeball-none'}
                tooltip={mon ? (
                  <div className={styles.piconTooltip}>
                    {nickname ? (
                      <>
                        {nickname}{' '}
                        (<strong>{friendlyPokemonName}</strong>)
                      </>
                    ) : <strong>{friendlyPokemonName}</strong>}
                    {
                      !!item &&
                      <>
                        <br />
                        {item}
                      </>
                    }
                  </div>
                ) : undefined}
                disabled={!mon?.speciesForme}
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
        gen={gen}
        format={format}
        rules={rules}
        playerKey={playerKey}
        playerPokemon={playerPokemon}
        opponentPokemon={opponentPokemon}
        field={{
          ...field,
          attackerSide: playerSideId === playerKey ? field?.attackerSide : field?.defenderSide,
          defenderSide: playerSideId === playerKey ? field?.defenderSide : field?.attackerSide,
        }}
        onPokemonChange={(p) => onPokemonChange?.(playerKey, p)}
      />
    </div>
  );
};
