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

  const topKey = authPlayerKey && playerKey === authPlayerKey
    ? settings?.authPosition === 'bottom'
      ? opponentKey
      : (settings?.authPosition === 'auto' ? 'p1' : playerKey)
    : playerKey;

  const bottomKey = topKey === 'p1' ? 'p2' : 'p1';

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
