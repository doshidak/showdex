import * as React from 'react';
import cx from 'classnames';
import { BuildInfo } from '@showdex/components/debug';
import { Scrollable } from '@showdex/components/ui';
import { useColorScheme } from '@showdex/redux/store';
import { useElementSize, useMobileViewport } from '@showdex/utils/hooks';
import { useCalcdexContext } from './CalcdexProvider';
import { CloseCalcdexButton } from './CloseCalcdexButton';
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
    renderMode,
    shouldRender,
  } = useCalcdexContext();

  const colorScheme = useColorScheme();
  const mobile = useMobileViewport();

  if (!shouldRender) {
    return null;
  }

  const renderAsOverlay = renderMode === 'overlay';

  const {
    battleId,
    playerKey,
    authPlayerKey,
    opponentKey,
  } = state;

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
      && settings?.authPosition === 'bottom'
      && opponentKey
  ) || playerKey;

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
      {
        !!battleId &&
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
            playerKey={topKey}
            defaultName="Player 1"
            containerSize={size}
          />

          <FieldCalc
            className={cx(styles.section, styles.fieldCalc)}
            playerKey={topKey}
            opponentKey={bottomKey}
            containerSize={size}
          />

          <PlayerCalc
            className={cx(styles.section, styles.opponentCalc)}
            playerKey={bottomKey}
            defaultName="Player 2"
            containerSize={size}
          />

          {
            (renderAsOverlay && mobile) &&
            <CloseCalcdexButton
              className={styles.bottomCloseButton}
              onPress={onRequestOverlayClose}
            />
          }
        </Scrollable>
      }
    </div>
  );
};
