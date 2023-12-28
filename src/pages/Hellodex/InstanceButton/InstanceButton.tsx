import * as React from 'react';
import Svg from 'react-inlinesvg';
import cx from 'classnames';
import { type BaseButtonProps, type ButtonElement, BaseButton } from '@showdex/components/ui';
import { bullop } from '@showdex/consts/core';
import { type CalcdexBattleState } from '@showdex/interfaces/calc';
import { useColorScheme } from '@showdex/redux/store';
import { findPlayerTitle } from '@showdex/utils/app';
import { getResourceUrl } from '@showdex/utils/core';
import { parseBattleFormat } from '@showdex/utils/dex';
import styles from './InstanceButton.module.scss';

export interface InstanceButtonProps extends Omit<BaseButtonProps, 'display'> {
  instance: CalcdexBattleState;
  authName?: string;
}

export const InstanceButton = React.forwardRef<ButtonElement, InstanceButtonProps>(({
  className,
  instance,
  authName,
  hoverScale = 1,
  activeScale = 0.98,
  disabled,
  ...props
}: InstanceButtonProps, forwardedRef): JSX.Element => {
  const colorScheme = useColorScheme();

  const {
    operatingMode,
    name,
    gen,
    format,
    subFormats,
    active,
    playerCount,
    p1: player,
    p2: opponent,
  } = instance || {};

  const {
    label,
    suffixes,
  } = React.useMemo(() => parseBattleFormat(
    [format, ...(subFormats || [])].filter(Boolean).join(''),
    { populateSuffixes: true },
  ), [
    format,
    subFormats,
  ]);

  const hasMorePlayers = (playerCount || 0) > 2;

  const playerName = player?.name;
  const opponentNameFromProps = opponent?.name;

  const authPlayer = !!authName
    && [playerName, opponentNameFromProps].includes(authName);

  const opponentName = !authPlayer || authName === playerName
    ? opponentNameFromProps
    : playerName;

  const playerTitle = findPlayerTitle(playerName, true);
  const playerLabelColor = playerTitle?.color?.[colorScheme];
  const playerIconColor = playerTitle?.iconColor?.[colorScheme];
  const opponentTitle = findPlayerTitle(opponentName, true);
  const opponentLabelColor = opponentTitle?.color?.[colorScheme];
  const opponentIconColor = opponentTitle?.iconColor?.[colorScheme];

  return (
    <BaseButton
      ref={forwardedRef}
      {...props}
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        active && styles.active,
        className,
      )}
      display="block"
      hoverScale={hoverScale}
      activeScale={activeScale}
    >
      {operatingMode === 'standalone' ? (
        <div className={styles.standaloneIcon}>
          <i className="fa fa-car" />
        </div>
      ) : (
        <Svg
          className={styles.battleIcon}
          description="Sword Icon"
          src={getResourceUrl('sword.svg')}
        />
      )}

      <div className={styles.info}>
        <div className={styles.format}>
          Gen {gen}
          {
            !!label &&
            <>
              {' '}&bull;{' '}
              <strong>{label}</strong>
            </>
          }
          {!!suffixes && ' '}
          {suffixes.map((s) => s[1]).join(` ${bullop} `)}
        </div>

        {operatingMode === 'standalone' ? (
          <div
            className={cx(
              styles.honkName,
              !!name && styles.saved,
            )}
          >
            {name || 'untitled honk'}
          </div>
        ) : (
          <div className={styles.players}>
            {
              (!!playerName && !!opponentName) &&
              <>
                {
                  !authPlayer &&
                  <div
                    className={styles.username}
                    style={playerLabelColor ? { color: playerLabelColor } : undefined}
                  >
                    {playerName}

                    {
                      !!playerTitle?.icon &&
                      <Svg
                        className={styles.usernameIcon}
                        style={playerIconColor ? { color: playerIconColor } : undefined}
                        description={playerTitle.iconDescription}
                        src={getResourceUrl(`${playerTitle.icon}.svg`)}
                      />
                    }
                  </div>
                }

                <div
                  className={cx(
                    styles.versus,
                    authPlayer && styles.noPlayerName,
                  )}
                >
                  vs
                </div>

                <div
                  className={styles.username}
                  style={opponentLabelColor ? { color: opponentLabelColor } : undefined}
                >
                  {opponentName}

                  {
                    !!opponentTitle?.icon &&
                    <Svg
                      className={styles.usernameIcon}
                      style={opponentIconColor ? { color: opponentIconColor } : undefined}
                      description={opponentTitle.iconDescription}
                      src={getResourceUrl(`${opponentTitle.icon}.svg`)}
                    />
                  }
                </div>

                {
                  hasMorePlayers &&
                  <span className={styles.morePlayers}>
                    &amp; friends
                  </span>
                }
              </>
            }
          </div>
        )}
      </div>
    </BaseButton>
  );
});
