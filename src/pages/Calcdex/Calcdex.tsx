import * as React from 'react';
import Svg from 'react-inlinesvg';
import cx from 'classnames';
import { AllPlayerKeys } from '@showdex/consts/battle';
import { BuildInfo } from '@showdex/components/debug';
import { Scrollable } from '@showdex/components/ui';
import { useColorScheme } from '@showdex/redux/store';
import { findPlayerTitle } from '@showdex/utils/app';
import { getResourceUrl } from '@showdex/utils/core';
import { useElementSize, useMobileViewport } from '@showdex/utils/hooks';
import type { DropdownOption } from '@showdex/components/form';
import type { CalcdexPlayerKey } from '@showdex/redux/store';
import { useCalcdexContext } from './CalcdexContext';
import { CloseButton } from './CloseButton';
import { FieldCalc } from './FieldCalc';
import { PlayerCalc } from './PlayerCalc';
import styles from './Calcdex.module.scss';

export interface CalcdexProps {
  onRequestOverlayClose?: () => void;
}

export const Calcdex = ({
  onRequestOverlayClose,
}: CalcdexProps): JSX.Element => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const { size } = useElementSize(containerRef, {
    initialWidth: 400,
    initialHeight: 700,
  });

  const {
    state,
    settings,
  } = useCalcdexContext();

  const colorScheme = useColorScheme();
  const mobile = useMobileViewport();

  const {
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
        const playerTitle = findPlayerTitle(playerName);

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
          rightLabel: k.toUpperCase(),
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
        renderAsOverlay && styles.overlay,
        !!colorScheme && styles[colorScheme],
      )}
    >
      <Scrollable className={styles.content}>
        <BuildInfo
          position="top-right"
        />

        {
          (renderAsOverlay && mobile) &&
          <CloseButton
            className={styles.topCloseButton}
            onPress={onRequestOverlayClose}
          />
        }

        <PlayerCalc
          className={styles.section}
          position="top"
          playerKey={topKey}
          defaultName="Player 1"
          containerSize={size}
          playerOptions={playerOptions}
        />

        <FieldCalc
          className={cx(styles.section, styles.fieldCalc)}
          playerKey={topKey}
          opponentKey={bottomKey}
          containerSize={size}
        />

        <PlayerCalc
          className={cx(styles.section, styles.opponentCalc)}
          position="bottom"
          playerKey={bottomKey}
          defaultName="Player 2"
          containerSize={size}
          playerOptions={playerOptions}
        />

        {
          renderAsOverlay &&
          <CloseButton
            className={cx(
              styles.bottomCloseButton,
              mobile && styles.mobile,
            )}
            onPress={onRequestOverlayClose}
          />
        }
      </Scrollable>
    </div>
  );
};
