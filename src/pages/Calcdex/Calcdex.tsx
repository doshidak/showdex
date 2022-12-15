import * as React from 'react';
// import useSize from '@react-hook/size';
import cx from 'classnames';
import { BuildInfo } from '@showdex/components/debug';
import { Scrollable } from '@showdex/components/ui';
import { useCalcdexSettings, useColorScheme } from '@showdex/redux/store';
// import { logger } from '@showdex/utils/debug';
import { useElementSize, useMobileViewport } from '@showdex/utils/hooks';
import { CloseCalcdexButton } from './CloseCalcdexButton';
import { FieldCalc } from './FieldCalc';
import { PlayerCalc } from './PlayerCalc';
import { useCalcdex } from './useCalcdex';
import styles from './Calcdex.module.scss';

interface CalcdexProps {
  battle?: Showdown.Battle;
  battleId?: string;
  request?: Showdown.BattleRequest;
  onRequestOverlayClose?: () => void;
}

// const l = logger('@showdex/pages/Calcdex/Calcdex');

export const Calcdex = ({
  battle,
  battleId: battleIdFromProps,
  request,
  onRequestOverlayClose,
}: CalcdexProps): JSX.Element => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  // const [containerWidth] = useSize(containerRef, {
  //   initialWidth: 400,
  //   initialHeight: 700,
  // });

  const { size } = useElementSize(containerRef, {
    initialWidth: 400,
    initialHeight: 700,
  });

  const settings = useCalcdexSettings();
  const colorScheme = useColorScheme();

  const {
    state,
    renderAsOverlay,
    shouldRender,
    updatePokemon,
    updateField,
    setSelectionIndex,
    setAutoSelect,
  } = useCalcdex({
    battle,
    battleId: battleIdFromProps,
    request,
  });

  const mobile = useMobileViewport();

  if (!shouldRender) {
    return null;
  }

  const {
    battleId,
    gen,
    format,
    rules,
    playerKey,
    authPlayerKey,
    opponentKey,
    p1,
    p2,
    field,
  } = state;

  // const topKey = authPlayerKey && playerKey === authPlayerKey && settings?.authPosition === 'bottom'
  //   ? opponentKey
  //   : playerKey;

  const topKey = authPlayerKey && playerKey === authPlayerKey
    ? settings?.authPosition === 'bottom'
      ? opponentKey
      : (settings?.authPosition === 'auto' ? 'p1' : playerKey)
    : playerKey;

  const bottomKey = topKey === 'p1' ? 'p2' : 'p1';

  // map the sides as the player and opponent to track them easier
  const player = topKey === 'p1' ? p1 : p2;
  const opponent = bottomKey === 'p1' ? p1 : p2;

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
            gen={gen}
            format={format}
            rules={rules}
            authPlayerKey={authPlayerKey}
            playerKey={topKey}
            player={player}
            opponent={opponent}
            field={field}
            defaultName="Player 1"
            containerSize={size}
            onPokemonChange={updatePokemon}
            onIndexSelect={(index) => setSelectionIndex(
              topKey,
              index,
            )}
            onAutoSelectChange={(autoSelect) => setAutoSelect(
              topKey,
              autoSelect,
            )}
          />

          <FieldCalc
            className={cx(styles.section, styles.fieldCalc)}
            battleId={battleId}
            gen={gen}
            format={format}
            authPlayerKey={authPlayerKey}
            playerKey={topKey}
            field={field}
            containerSize={size}
            disabled={!p1?.pokemon?.length || !p2?.pokemon?.length}
            onFieldChange={updateField}
          />

          <PlayerCalc
            className={cx(styles.section, styles.opponentCalc)}
            gen={gen}
            format={format}
            rules={rules}
            authPlayerKey={authPlayerKey}
            playerKey={bottomKey}
            player={opponent}
            opponent={player}
            field={field}
            defaultName="Player 2"
            containerSize={size}
            onPokemonChange={updatePokemon}
            onIndexSelect={(index) => setSelectionIndex(
              bottomKey,
              index,
            )}
            onAutoSelectChange={(autoSelect) => setAutoSelect(
              bottomKey,
              autoSelect,
            )}
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
