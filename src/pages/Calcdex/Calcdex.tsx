import * as React from 'react';
import { useTranslation } from 'react-i18next';
import Svg from 'react-inlinesvg';
import cx from 'classnames';
import {
  CloseButton,
  FieldCalc,
  PlayerCalc,
  useCalcdexContext,
  useCalcdexSize,
} from '@showdex/components/calc';
import { BuildInfo } from '@showdex/components/debug';
import { type DropdownOption } from '@showdex/components/form';
import { BaseButton, Scrollable } from '@showdex/components/ui';
import { type CalcdexPlayerKey, CalcdexPlayerKeys as AllPlayerKeys } from '@showdex/interfaces/calc';
import { useColorScheme, useGlassyTerrain } from '@showdex/redux/store';
import { findPlayerTitle } from '@showdex/utils/app';
import { getResourceUrl } from '@showdex/utils/core';
import { useMobileViewport } from '@showdex/utils/hooks';
import styles from './Calcdex.module.scss';

export interface CalcdexProps {
  onRequestOverlayClose?: () => void;
}

export const Calcdex = ({
  onRequestOverlayClose,
}: CalcdexProps): JSX.Element => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useCalcdexSize(containerRef);

  const {
    state,
    settings,
  } = useCalcdexContext();

  const { t } = useTranslation('calcdex');
  const colorScheme = useColorScheme();
  const glassyTerrain = useGlassyTerrain();
  const mobile = useMobileViewport();

  const {
    containerSize,
    renderMode,
    playerCount,
    playerKey,
    authPlayerKey,
    opponentKey,
    switchPlayers,
  } = state;

  const playerOptions = React.useMemo<DropdownOption<CalcdexPlayerKey>[]>(() => (
    playerCount > 2 && AllPlayerKeys
      // .filter((k) => state[k]?.active && (!authPlayerKey || k !== authPlayerKey))
      .filter((k) => state[k]?.active)
      .map((k) => {
        const { name: playerName } = state[k];
        const playerTitle = findPlayerTitle(playerName, true);

        const labelColor = playerTitle?.color?.[colorScheme];
        const iconColor = playerTitle?.iconColor?.[colorScheme];

        return {
          labelClassName: styles.playerOption,
          labelStyle: labelColor ? { color: labelColor } : undefined,
          label: (
            <>
              <div className={styles.label}>
                {playerName || '--'}
              </div>

              {
                !!playerTitle?.icon &&
                <Svg
                  className={styles.icon}
                  style={iconColor ? { color: iconColor } : undefined}
                  description={playerTitle.iconDescription}
                  src={getResourceUrl(`${playerTitle.icon}.svg`)}
                />
              }
            </>
          ),
          rightLabel: t('player.user.optionLabel', {
            index: k.replace('p', ''),
            playerKey: k.toUpperCase(),
          }),
          subLabel: playerTitle?.title,
          value: k,
          disabled: !playerName,
        };
      })
  ) || null, [
    // authPlayerKey,
    colorScheme,
    playerCount,
    state,
    t,
  ]);

  const renderAsOverlay = renderMode === 'overlay';

  const topKey = (
    !!authPlayerKey
      && playerKey === authPlayerKey
      && (
        (settings?.authPosition === 'bottom' && opponentKey)
          || (settings?.authPosition === 'auto' && ((playerKey === 'p1' && playerKey) || opponentKey))
      )
  ) || (!authPlayerKey && switchPlayers ? opponentKey : playerKey);

  const bottomKey = topKey === playerKey
    ? opponentKey
    : playerKey;

  return (
    <div
      ref={containerRef}
      className={cx(
        'showdex-module',
        styles.container,
        containerSize === 'xs' && styles.verySmol,
        !!colorScheme && styles[colorScheme],
        renderAsOverlay && styles.overlay,
        glassyTerrain && styles.glassy,
      )}
    >
      <Scrollable className={styles.content}>
        <BuildInfo
          position="top-right"
        />

        {
          (renderAsOverlay && !mobile) &&
          <BaseButton
            className={styles.overlayCloseButton}
            display="block"
            aria-label="Close Calcdex"
            onPress={onRequestOverlayClose}
          >
            <i className="fa fa-close" />
          </BaseButton>
        }

        {
          (renderAsOverlay && mobile) &&
          <CloseButton
            className={cx(
              styles.mobileCloseButton,
              styles.top,
            )}
            onPress={onRequestOverlayClose}
          />
        }

        <PlayerCalc
          className={styles.playerCalc}
          position="top"
          playerKey={topKey}
          defaultName={t('player.user.defaultName', { index: 1 })}
          playerOptions={playerOptions}
          mobile={mobile}
        />

        <FieldCalc
          className={styles.fieldCalc}
          playerKey={topKey}
          opponentKey={bottomKey}
        />

        <PlayerCalc
          className={styles.opponentCalc}
          position="bottom"
          playerKey={bottomKey}
          defaultName={t('player.user.defaultName', { index: 2 })}
          playerOptions={playerOptions}
          mobile={mobile}
        />

        {
          (renderAsOverlay && mobile) &&
          <CloseButton
            className={cx(
              styles.mobileCloseButton,
              styles.bottom,
            )}
            onPress={onRequestOverlayClose}
          />
        }
      </Scrollable>
    </div>
  );
};
