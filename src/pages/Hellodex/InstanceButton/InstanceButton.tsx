import * as React from 'react';
import { useTranslation } from 'react-i18next';
import Svg from 'react-inlinesvg';
import cx from 'classnames';
import { type BaseButtonProps, type ButtonElement, BaseButton } from '@showdex/components/ui';
import { bullop } from '@showdex/consts/core';
import { GenLabels } from '@showdex/consts/dex';
import { type CalcdexBattleState } from '@showdex/interfaces/calc';
import { useColorScheme, useGlassyTerrain } from '@showdex/redux/store';
import { findPlayerTitle } from '@showdex/utils/app';
import { getResourceUrl } from '@showdex/utils/core';
import { parseBattleFormat } from '@showdex/utils/dex';
import styles from './InstanceButton.module.scss';

export interface InstanceButtonProps extends Omit<BaseButtonProps, 'display'> {
  instance: CalcdexBattleState;
  authName?: string;
  onRequestRemove?: () => void;
}

export interface InstanceButtonRef extends ButtonElement {
  queueRemoval: () => void;
}

export const InstanceButton = React.forwardRef<InstanceButtonRef, InstanceButtonProps>(({
  className,
  instance,
  authName,
  hoverScale = 1,
  activeScale = 0.98,
  disabled,
  onPress,
  onContextMenu,
  onRequestRemove,
  ...props
}: InstanceButtonProps, forwardedRef): JSX.Element => {
  const { t } = useTranslation('pokedex');
  const containerRef = React.useRef<ButtonElement>(null);
  const colorScheme = useColorScheme();
  const glassyTerrain = useGlassyTerrain();

  const {
    operatingMode,
    name,
    defaultName,
    gen,
    format,
    subFormats,
    active,
    playerCount,
    p1: player,
    p2: opponent,
    cached,
  } = instance || {};

  const { slug: genSlug } = GenLabels[gen] || {};
  const genLabel = (!!genSlug && t(`gens.${genSlug}.label`, '')) || null;

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

  const [removalQueued, setRemovalQueued] = React.useState(false);
  const removalRequestTimeout = React.useRef<NodeJS.Timeout>(null);

  const queueRemovalRequest = () => {
    if (typeof onRequestRemove !== 'function') {
      return;
    }

    if (removalQueued) {
      if (removalRequestTimeout.current) {
        clearTimeout(removalRequestTimeout.current);
        removalRequestTimeout.current = null;
      }

      return void setRemovalQueued(false);
    }

    removalRequestTimeout.current = setTimeout(onRequestRemove, 3000);
    setRemovalQueued(true);
  };

  React.useImperativeHandle(forwardedRef, () => ({
    ...containerRef.current,
    queueRemoval: queueRemovalRequest,
  }));

  return (
    <BaseButton
      ref={containerRef}
      {...props}
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        glassyTerrain && styles.glassy,
        active && styles.active,
        (!!name && !!cached) && styles.saved,
        removalQueued && styles.removing,
        className,
      )}
      display="block"
      hoverScale={hoverScale}
      activeScale={activeScale}
      onPress={removalQueued ? queueRemovalRequest : onPress}
      onContextMenu={(e) => {
        if (removalQueued) {
          queueRemovalRequest();
        }

        onContextMenu(e);
      }}
    >
      {operatingMode === 'standalone' ? (
        <div className={cx(styles.icon, styles.standaloneIcon)}>
          <i className="fa fa-car" />
        </div>
      ) : (
        <Svg
          className={cx(styles.icon, styles.battleIcon)}
          description="Sword Icon"
          src={getResourceUrl('sword.svg')}
        />
      )}

      <div className={styles.info}>
        <div className={styles.format}>
          {t('honkdex:battle.gen.friendlyLabel', {
            gen: gen || '--',
            defaultValue: `Gen ${gen || '--'}`,
          })}

          {
            !!label &&
            <>
              {' '}&bull;{' '}
              {!!genLabel && `${genLabel} `}
              <strong>{label}</strong>
            </>
          }

          {!!suffixes && ' '}
          {suffixes.map((s) => s[1]).join(` ${bullop} `)}
        </div>

        {operatingMode === 'standalone' ? (
          <div className={styles.honkName}>
            {name || defaultName || 'untitled honk'}
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
                    &amp; {t('honkdex:battle.name.friends')}
                  </span>
                }
              </>
            }
          </div>
        )}
      </div>

      {
        operatingMode === 'standalone' &&
        <BaseButton
          className={styles.removeButton}
          aria-label="Permanently Delete Honkdex"
          hoverScale={1}
          activeScale={0.98}
          disabled={typeof onRequestRemove !== 'function'}
          onPress={queueRemovalRequest}
        >
          <i className="fa fa-times-circle" />
        </BaseButton>
      }

      {
        (operatingMode === 'standalone' && removalQueued) &&
        <div className={styles.undoOverlay}>
          Undo?
        </div>
      }
    </BaseButton>
  );
});
