import * as React from 'react';
import Svg from 'react-inlinesvg';
import cx from 'classnames';
import { PiconButton } from '@showdex/components/app';
import { type DropdownOption, Dropdown } from '@showdex/components/form';
import { Button, ToggleButton, Tooltip } from '@showdex/components/ui';
import { eacute } from '@showdex/consts/core';
import { useUserLadderQuery } from '@showdex/redux/services';
import { type CalcdexPlayerKey, useColorScheme } from '@showdex/redux/store';
import { findPlayerTitle, openUserPopup } from '@showdex/utils/app';
import { calcPokemonCurrentHp } from '@showdex/utils/calc';
import { env, formatId, getResourceUrl } from '@showdex/utils/core';
import { hasNickname } from '@showdex/utils/dex';
import { capitalize } from '@showdex/utils/humanize';
import { type ElementSizeLabel } from '@showdex/utils/hooks';
import { CalcdexPokeProvider } from '../CalcdexPokeContext';
import { useCalcdexContext } from '../CalcdexContext';
import { PokeCalc } from '../PokeCalc';
import styles from './PlayerCalc.module.scss';

interface PlayerCalcProps {
  className?: string;
  style?: React.CSSProperties;
  position?: 'top' | 'bottom';
  playerKey?: CalcdexPlayerKey;
  defaultName?: string;
  containerSize?: ElementSizeLabel;
  playerOptions?: DropdownOption<CalcdexPlayerKey>[];
}

const baseScope = '@showdex/pages/Calcdex/PlayerCalc';
const minPokemon = env.int('calcdex-player-min-pokemon');

export const PlayerCalc = ({
  className,
  style,
  position = 'top',
  playerKey = 'p1',
  defaultName = '--',
  containerSize,
  playerOptions,
}: PlayerCalcProps): JSX.Element => {
  const ctx = useCalcdexContext();

  const {
    state,
    settings,
    setSelectionIndex,
    setAutoSelect,
  } = ctx;

  const colorScheme = useColorScheme();

  const {
    format,
    legacy,
  } = state;

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
  const playerTitle = findPlayerTitle(playerId, true);
  const playerLabelColor = playerTitle?.color?.[colorScheme];
  const playerIconColor = playerTitle?.iconColor?.[colorScheme];
  const playerPokemon = playerParty?.[playerIndex];

  // only fetch the rating if the battle didn't provide it to us
  // (with a terribly-implemented delay timer to give some CPU time for drawing the UI)
  const [delayedQuery, setDelayedQuery] = React.useState(true);
  const delayedQueryTimeout = React.useRef<NodeJS.Timeout>(null);

  const skipLadderQuery = !settings?.showPlayerRatings
    || !playerId
    || !format
    || !!ratingFromBattle;

  React.useEffect(() => {
    // checking `playerId` in case the component hasn't received its props yet;
    // once `delayedQuery` is `false`, we no longer bother refetching
    if (!playerId || !delayedQuery || skipLadderQuery) {
      return;
    }

    delayedQueryTimeout.current = setTimeout(
      () => setDelayedQuery(false),
      9669, // arbitrary af
    );

    return () => {
      if (delayedQueryTimeout.current) {
        clearTimeout(delayedQueryTimeout.current);
        delayedQueryTimeout.current = null;
      }
    };
  }, [
    delayedQuery,
    playerId,
    skipLadderQuery,
  ]);

  const {
    ladder,
  } = useUserLadderQuery(playerId, {
    skip: skipLadderQuery || delayedQuery,

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
          {playerOptions?.length ? (
            <Dropdown
              aria-label={`Player Selector for the ${capitalize(position)} Section`}
              hint={name || defaultName}
              tooltip={settings?.showUiTooltips ? (
                <div className={styles.tooltipContent}>
                  Switch <strong>{capitalize(position)}</strong> Player
                </div>
              ) : null}
              input={{
                name: `PlayerCalc:PlayerKey:${position}:Dropdown`,
                value: playerKey,
                onChange: (key: CalcdexPlayerKey) => ctx[position === 'top' ? 'setPlayerKey' : 'setOpponentKey'](
                  key,
                  `${baseScope}:Dropdown~PlayerKey-${position}:input.onChange()`,
                ),
              }}
              options={playerOptions}
              noOptionsMessage="No Players Found"
              clearable={false}
              disabled={!playerKey}
            />
          ) : (
            <Button
              className={styles.usernameButton}
              style={playerLabelColor ? { color: playerLabelColor } : undefined}
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
                  style={playerIconColor ? { color: playerIconColor } : undefined}
                  description={playerTitle.iconDescription}
                  src={getResourceUrl(`${playerTitle.icon}.svg`)}
                />
              }
            </Button>
          )}

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
          {Array(Math.max(maxPokemon || 0, minPokemon)).fill(null).map((_, i) => {
            const pokemon = playerParty?.[i];

            const pokemonKey = pokemon?.calcdexId
              || pokemon?.ident
              || pokemon?.searchid
              || pokemon?.details
              || pokemon?.name
              || pokemon?.speciesForme
              // || defaultName
              || String(i);

            const friendlyPokemonName = pokemon?.speciesForme
              || pokemon?.name
              || pokemonKey;

            const nickname = hasNickname(pokemon) && settings?.showNicknames
              ? pokemon.name
              : null;

            // const speciesForme = mon?.transformedForme || mon?.speciesForme;
            const speciesForme = pokemon?.speciesForme; // don't show transformedForme here, as requested by camdawgboi
            const hp = calcPokemonCurrentHp(pokemon);
            const ability = pokemon?.dirtyAbility || pokemon?.ability;
            const item = pokemon?.dirtyItem ?? pokemon?.item;

            // only tracking Ruin abilities (gen 9) atm
            const abilityActive = !legacy
              && formatId(ability)?.endsWith('ofruin')
              && pokemon.abilityToggled;

            const pokemonActive = !!pokemon?.calcdexId
              && activeIndices.includes(i);

            const pokemonSelected = !!pokemon?.calcdexId
              && !!playerPokemon?.calcdexId
              && playerPokemon.calcdexId === pokemon.calcdexId;

            return (
              <PiconButton
                key={`PlayerCalc:Picon:${playerKey}:${pokemonKey}`}
                className={cx(
                  styles.piconButton,
                  pokemonActive && styles.active,
                  pokemonSelected && styles.selected,
                  !hp && styles.fainted,
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
