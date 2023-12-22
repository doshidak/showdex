import * as React from 'react';
import Svg from 'react-inlinesvg';
import cx from 'classnames';
import { type DropdownOption, Dropdown } from '@showdex/components/form';
import { Button, ToggleButton, Tooltip } from '@showdex/components/ui';
import { eacute } from '@showdex/consts/core';
import { type CalcdexPlayerKey } from '@showdex/interfaces/calc';
import { useUserLadderQuery } from '@showdex/redux/services';
import { useColorScheme } from '@showdex/redux/store';
import { findPlayerTitle } from '@showdex/utils/app';
import { formatId, getResourceUrl } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { openUserPopup } from '@showdex/utils/host';
import { capitalize } from '@showdex/utils/humanize';
import { useCalcdexContext } from '../CalcdexContext';
import styles from './PlayerInfo.module.scss';

export interface PlayerInfoProps {
  className?: string;
  style?: React.CSSProperties;
  position?: 'top' | 'bottom';
  playerKey?: CalcdexPlayerKey;
  defaultName?: string;
  playerOptions?: DropdownOption<CalcdexPlayerKey>[];
}

const l = logger('@showdex/components/calc/PlayerInfo');

export const PlayerInfo = ({
  className,
  style,
  position = 'top',
  playerKey = 'p1',
  defaultName = '--',
  playerOptions,
}: PlayerInfoProps): JSX.Element => {
  const colorScheme = useColorScheme();

  const {
    state,
    settings,
    assignPlayer,
    assignOpponent,
    autoSelectPokemon,
  } = useCalcdexContext();

  const {
    containerSize,
    format,
  } = state || {};

  const {
    name,
    rating: ratingFromBattle,
    autoSelect,
    pokemon: playerParty,
  } = state[playerKey] || {};

  const playerId = formatId(name);
  const playerTitle = findPlayerTitle(playerId, true);
  const playerLabelColor = playerTitle?.color?.[colorScheme];
  const playerIconColor = playerTitle?.iconColor?.[colorScheme];

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
      6996, // arbitrary af
    );

    return () => {
      if (!delayedQueryTimeout.current) {
        return;
      }

      clearTimeout(delayedQueryTimeout.current);
      delayedQueryTimeout.current = null;
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
      ladder: data?.find?.((d) => d?.userid === playerId && d.formatid === format),
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
        containerSize === 'xs' && styles.verySmol,
        !!colorScheme && styles[colorScheme],
        className,
      )}
      style={style}
    >
      {playerOptions?.length ? (
        <Dropdown
          aria-label={`${capitalize(position)} Player Selector`}
          hint={name || defaultName}
          tooltip={settings?.showUiTooltips ? (
            <div className={styles.tooltipContent}>
              Switch <strong>{capitalize(position)}</strong> Player
            </div>
          ) : null}
          input={{
            name: `PlayerInfo:${position}:Dropdown`,
            value: playerKey,
            onChange: (key: CalcdexPlayerKey) => (
              position === 'top'
                ? assignPlayer
                : assignOpponent
            )(
              key,
              `${l.scope}:Dropdown~PlayerKey-${position}:input.onChange()`,
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
          onPress={() => autoSelectPokemon(playerKey, !autoSelect)}
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
  );
};
