import * as React from 'react';
import Svg from 'react-inlinesvg';
import cx from 'classnames';
import { BaseButton } from '@showdex/components/ui';
import { FormatLabels } from '@showdex/consts/battle';
import { useColorScheme } from '@showdex/redux/store';
import { findPlayerTitle } from '@showdex/utils/app';
import { detectGenFromFormat } from '@showdex/utils/battle';
import { getResourceUrl } from '@showdex/utils/core';
import type { BaseButtonProps, ButtonElement } from '@showdex/components/ui';
import styles from './InstanceButton.module.scss';

export interface InstanceButtonProps extends Omit<BaseButtonProps, 'display'> {
  format?: string;
  authName?: string;
  playerName?: string;
  opponentName?: string;
  active?: boolean;
  hasMorePlayers?: boolean;
}

export const InstanceButton = React.forwardRef<ButtonElement, InstanceButtonProps>(({
  className,
  format,
  authName,
  playerName,
  opponentName: opponentNameFromProps,
  hoverScale = 1,
  activeScale = 0.98,
  active,
  hasMorePlayers,
  disabled,
  ...props
}: InstanceButtonProps, forwardedRef): JSX.Element => {
  const colorScheme = useColorScheme();

  const gen = detectGenFromFormat(format);
  const genlessFormat = gen > 0 ? format.replace(`gen${gen}`, '') : null;

  const authPlayer = !!authName
    && [playerName, opponentNameFromProps].includes(authName);

  const opponentName = !authPlayer || authName === playerName
    ? opponentNameFromProps
    : playerName;

  const playerTitle = findPlayerTitle(playerName);
  const playerLabelColor = playerTitle?.color?.[colorScheme];
  const playerIconColor = playerTitle?.iconColor?.[colorScheme];
  const opponentTitle = findPlayerTitle(opponentName);
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
      <Svg
        className={styles.battleIcon}
        description="Sword Icon"
        src={getResourceUrl('sword.svg')}
      />

      <div className={styles.info}>
        {
          !!genlessFormat &&
          <div className={styles.format}>
            Gen {gen} &bull;{' '}
            <strong>{FormatLabels[genlessFormat] || genlessFormat}</strong>
          </div>
        }

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
      </div>
    </BaseButton>
  );
});
