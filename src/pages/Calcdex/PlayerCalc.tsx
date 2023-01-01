import * as React from 'react';
import Svg from 'react-inlinesvg';
import cx from 'classnames';
import { PiconButton } from '@showdex/components/app';
import { Button, ToggleButton, Tooltip } from '@showdex/components/ui';
import { eacute } from '@showdex/consts/core';
import { useUserLadderQuery } from '@showdex/redux/services';
import { useColorScheme } from '@showdex/redux/store';
import { findPlayerTitle, formatId, openUserPopup } from '@showdex/utils/app';
import { hasNickname } from '@showdex/utils/battle';
import { getResourceUrl } from '@showdex/utils/core';
import type { ElementSizeLabel } from '@showdex/utils/hooks';
import type { CalcdexPlayerKey } from '@showdex/redux/store';
import { CalcdexPokeProvider } from './CalcdexPokeProvider';
import { useCalcdexContext } from './CalcdexProvider';
import { PokeCalc } from './PokeCalc';
import styles from './PlayerCalc.module.scss';

interface PlayerCalcProps {
  className?: string;
  style?: React.CSSProperties;
  playerKey?: CalcdexPlayerKey;
  defaultName?: string;
  containerSize?: ElementSizeLabel;
}

export const PlayerCalc = ({
  className,
  style,
  playerKey = 'p1',
  defaultName = '--',
  containerSize,
}: PlayerCalcProps): JSX.Element => {
  const {
    state,
    settings,
    setSelectionIndex,
    setAutoSelect,
  } = useCalcdexContext();

  const colorScheme = useColorScheme();

  const { format } = state;
  const player = state[playerKey] || {};

  const {
    name,
    rating: ratingFromBattle,
    pokemon: playerParty,
    maxPokemon,
    activeIndices,
    selectionIndex: playerIndex,
    autoSelect,
  } = player;

  const playerId = formatId(name);
  const playerTitle = findPlayerTitle(playerId);
  const playerPokemon = playerParty?.[playerIndex];

  // only fetch the rating if the battle didn't provide it to us
  const {
    ladder,
  } = useUserLadderQuery(playerId, {
    skip: !settings?.showPlayerRatings
      || !playerId
      || !format
      || !!ratingFromBattle,

    selectFromResult: ({ data }) => ({
      // map 'gen8unratedrandombattle' (for instance) to 'gen8randombattle'
      ladder: data?.find?.((d) => (
        d?.userid === playerId
          && d.formatid === format.replace('unrated', '')
      )),
    }),
  });

  const rating = ratingFromBattle
    || (!!ladder?.elo && Math.round(parseFloat(ladder.elo)));

  const additionalRatings = {
    gxe: ladder?.gxe ? `${ladder.gxe}%` : null,
    glicko1Rating: ladder?.rpr ? Math.round(parseFloat(ladder.rpr)) : null,
    glicko1Deviation: ladder?.rprd ? Math.round(parseFloat(ladder.rprd)) : null,
  };

  return (
    <div
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        className,
      )}
      style={style}
    >
      <div
        className={cx(
          styles.playerBar,
          containerSize === 'xs' && styles.verySmol,
        )}
      >
        <div className={styles.playerInfo}>
          <Button
            className={styles.usernameButton}
            style={playerTitle?.color?.[colorScheme] ? {
              color: playerTitle.color[colorScheme],
            } : undefined}
            labelClassName={styles.usernameButtonLabel}
            label={name || defaultName}
            tooltip={(
              <div className={styles.tooltipContent}>
                {
                  !!playerTitle?.title &&
                  <>
                    {settings?.showUiTooltips ? (
                      <em>{playerTitle.title}</em>
                    ) : playerTitle.title}
                    {
                      settings?.showUiTooltips &&
                      <br />
                    }
                  </>
                }
                {
                  settings?.showUiTooltips &&
                  <>
                    Open{' '}
                    {name ? (
                      <>
                        <strong>{name}</strong>'s
                      </>
                    ) : 'User'}{' '}
                    Profile
                  </>
                }
              </div>
            )}
            tooltipDisabled={!playerTitle && !settings?.showUiTooltips}
            hoverScale={1}
            absoluteHover
            disabled={!name}
            onPress={() => openUserPopup(name)}
          >
            {
              !!playerTitle?.icon &&
              <Svg
                className={styles.usernameButtonIcon}
                description={playerTitle.iconDescription}
                src={getResourceUrl(`${playerTitle.icon}.svg`)}
              />
            }
          </Button>

          <div className={styles.playerActions}>
            <ToggleButton
              className={styles.toggleButton}
              label="Auto"
              tooltip={`${autoSelect ? 'Manually ' : 'Auto-'}Select Pok${eacute}mon`}
              tooltipDisabled={!settings?.showUiTooltips}
              absoluteHover
              active={autoSelect}
              disabled={!playerParty?.length}
              onPress={() => setAutoSelect(playerKey, !autoSelect)}
            />

            {
              (settings?.showPlayerRatings && !!rating) &&
              <Tooltip
                content={(
                  <div className={styles.tooltipContent}>
                    {
                      !!ladder?.formatid &&
                      <div className={styles.ladderFormat}>
                        {ladder.formatid}
                      </div>
                    }

                    <div className={styles.ladderStats}>
                      {
                        !!additionalRatings.gxe &&
                        <>
                          <div className={styles.ladderStatLabel}>
                            GXE
                          </div>
                          <div className={styles.ladderStatValue}>
                            {additionalRatings.gxe}
                          </div>
                        </>
                      }

                      {
                        !!additionalRatings.glicko1Rating &&
                        <>
                          <div className={styles.ladderStatLabel}>
                            Glicko-1
                          </div>
                          <div className={styles.ladderStatValue}>
                            {additionalRatings.glicko1Rating}
                            {
                              !!additionalRatings.glicko1Deviation &&
                              <span style={{ opacity: 0.65 }}>
                                &plusmn;{additionalRatings.glicko1Deviation}
                              </span>
                            }
                          </div>
                        </>
                      }
                    </div>
                  </div>
                )}
                offset={[0, 10]}
                delay={[1000, 50]}
                trigger="mouseenter"
                touch={['hold', 500]}
                disabled={!ladder?.id}
              >
                <div
                  className={cx(
                    styles.rating,
                    !!rating && styles.visible,
                  )}
                >
                  {
                    !!rating &&
                    <>
                      <span className={styles.ratingSeparator}>
                        &bull;
                      </span>

                      {rating} ELO
                    </>
                  }
                </div>
              </Tooltip>
            }
          </div>
        </div>

        <div
          className={styles.teamList}
          style={{
            gridTemplateColumns: `repeat(${['xs', 'sm'].includes(containerSize) ? 6 : 12}, min-content)`,
          }}
        >
          {Array(maxPokemon || 0).fill(null).map((_, i) => {
            const pokemon = playerParty?.[i];

            const pokemonKey = pokemon?.calcdexId
              || pokemon?.ident
              || pokemon?.searchid
              || pokemon?.details
              || pokemon?.name
              || pokemon?.speciesForme
              || defaultName
              || '???';

            const friendlyPokemonName = pokemon?.speciesForme
              || pokemon?.name
              || pokemonKey;

            const nickname = hasNickname(pokemon) && settings?.showNicknames
              ? pokemon.name
              : null;

            // const speciesForme = mon?.transformedForme || mon?.speciesForme;
            const speciesForme = pokemon?.speciesForme; // don't show transformedForme here, as requested by camdawgboi
            const item = pokemon?.dirtyItem ?? pokemon?.item;

            const pokemonActive = !!pokemon?.calcdexId
              // && !!activePokemon?.calcdexId
              // && activePokemon.calcdexId === mon.calcdexId;
              && activeIndices.includes(i);

            const pokemonSelected = !!pokemon?.calcdexId
              && !!playerPokemon?.calcdexId
              && playerPokemon.calcdexId === pokemon.calcdexId;

            return (
              <PiconButton
                key={`PlayerCalc:Picon:${playerKey}:${pokemonKey}:${i}`}
                className={cx(
                  styles.piconButton,
                  pokemonActive && styles.active,
                  pokemonSelected && styles.selected,
                  !pokemon?.hp && styles.fainted,
                )}
                piconClassName={styles.picon}
                display="block"
                aria-label={`Select ${friendlyPokemonName}`}
                pokemon={pokemon ? {
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
                      !!item &&
                      <>
                        <br />
                        {item}
                      </>
                    }
                  </div>
                ) : undefined}
                disabled={!pokemon?.speciesForme}
                onPress={() => setSelectionIndex(playerKey, i)}
              >
                <div className={styles.background} />
              </PiconButton>
            );
          })}
        </div>
      </div>

      <CalcdexPokeProvider playerKey={playerKey}>
        <PokeCalc
          className={styles.pokeCalc}
          containerSize={containerSize}
        />
      </CalcdexPokeProvider>
    </div>
  );
};
