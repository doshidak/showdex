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
import { useCalcdexContext } from './CalcdexProvider';
import { CloseCalcdexButton } from './CloseCalcdexButton';
import { FieldCalc } from './FieldCalc';
import { PlayerCalc } from './PlayerCalc';
import styles from './Calcdex.module.scss';

export interface CalcdexProps {
  // overlayVisible?: boolean;
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
    // shouldRender,
  } = useCalcdexContext();

  const colorScheme = useColorScheme();
  const mobile = useMobileViewport();

  const {
    // battleId,
    renderMode,
    // overlayVisible,
    playerCount,
    playerKey,
    authPlayerKey,
    opponentKey,
    switchPlayers,
  } = state;

  const playerOptions = React.useMemo<DropdownOption<CalcdexPlayerKey>[]>(() => (
    playerCount > 2 && AllPlayerKeys
      .filter((k) => state[k]?.active && (!authPlayerKey || k !== authPlayerKey))
      .map((k) => {
        const { name: playerName } = state[k];
        const playerTitle = findPlayerTitle(playerName);

        return {
          labelClassName: styles.playerOption,
          labelStyle: playerTitle?.color?.[colorScheme] ? {
            color: playerTitle.color[colorScheme],
          } : undefined,
          label: (
            <>
              <div className={styles.label}>
                {playerName}
              </div>

              {
                !!playerTitle?.icon &&
                <Svg
                  className={styles.icon}
                  description={playerTitle.iconDescription}
                  src={getResourceUrl(`${playerTitle.icon}.svg`)}
                />
              }
            </>
          ),
          rightLabel: k.toUpperCase(),
          subLabel: playerTitle?.title,
          value: k,
        };
      })
  ) || null, [
    authPlayerKey,
    colorScheme,
    playerCount,
    state,
  ]);

  const renderAsOverlay = renderMode === 'overlay';

  // if (renderAsOverlay && !overlayVisible) {
  //   return null;
  // }

  // if authPlayerKey = playerKey = 'p1' and opponentKey = 'p2',
  // then topKey = 'p2' if authPosition is 'bottom' and 'p1' otherwise;
  // if authPlayerKey = playerKey = 'p2' and opponentKey = 'p1',
  // then topKey = 'p1' if authPosition is 'bottom' or 'auto', and 'p2' otherwise;
  // const topKey = authPlayerKey && playerKey === authPlayerKey
  //   ? settings?.authPosition === 'bottom'
  //     ? opponentKey
  //     : (settings?.authPosition === 'auto' ? 'p1' : playerKey)
  //   : playerKey;

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
          <CloseCalcdexButton
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
          playerOptions={(!authPlayerKey || topKey !== authPlayerKey) && playerOptions}
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
          playerOptions={(!authPlayerKey || bottomKey !== authPlayerKey) && playerOptions}
        />

        {
          renderAsOverlay &&
          <CloseCalcdexButton
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
