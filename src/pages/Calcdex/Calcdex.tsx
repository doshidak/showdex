import * as React from 'react';
import { useTranslation } from 'react-i18next';
import cx from 'classnames';
import { v4 as uuidv4 } from 'uuid';
import { MemberIcon } from '@showdex/components/app';
import {
  CloseButton,
  FieldCalc,
  PlayerCalc,
  useCalcdexContext,
  useCalcdexSize,
} from '@showdex/components/calc';
import { BuildInfo } from '@showdex/components/debug';
import { type DropdownOption } from '@showdex/components/form';
import { PiconRackProvider, PiconRackSortableContext } from '@showdex/components/layout';
import {
  ContextMenu,
  BaseButton,
  Scrollable,
  useContextMenu,
} from '@showdex/components/ui';
import { type CalcdexPlayerKey, CalcdexPlayerKeys as AllPlayerKeys } from '@showdex/interfaces/calc';
import {
  useCalcdexDuplicator,
  useColorScheme,
  useGlassyTerrain,
  useHonkdexSettings,
} from '@showdex/redux/store';
import { findPlayerTitle, getCalcdexRoomId } from '@showdex/utils/app';
import { useMobileViewport, useRandomUuid } from '@showdex/utils/hooks';
import { getBattleRoom } from '@showdex/utils/host';
import styles from './Calcdex.module.scss';

export interface CalcdexProps {
  onRequestHellodex?: () => void;
  onRequestHonkdex?: (instanceId?: string) => void;
  onCloseOverlay?: () => void;
}

export const Calcdex = ({
  onRequestHellodex,
  onRequestHonkdex,
  onCloseOverlay,
}: CalcdexProps): JSX.Element => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useCalcdexSize(containerRef);

  const { t } = useTranslation('calcdex');
  const colorScheme = useColorScheme();
  const glassyTerrain = useGlassyTerrain();
  const mobile = useMobileViewport();

  const { state, settings } = useCalcdexContext();
  const honkdexSettings = useHonkdexSettings();

  const {
    battleId,
    active: battleActive,
    containerSize,
    containerWidth,
    renderMode,
    playerCount,
    playerKey,
    authPlayerKey,
    opponentKey,
    switchPlayers,
  } = state;

  const room = React.useMemo(() => getBattleRoom(battleId), [battleId]);
  const dupeCalcdex = useCalcdexDuplicator();

  const playerOptions = React.useMemo<DropdownOption<CalcdexPlayerKey>[]>(() => (
    playerCount > 2 && AllPlayerKeys
      // .filter((k) => state[k]?.active && (!authPlayerKey || k !== authPlayerKey))
      .filter((k) => state[k]?.active)
      .map((k) => {
        const { name: playerName } = state[k];
        const playerTitle = findPlayerTitle(playerName, true);

        const labelColor = playerTitle?.color?.[colorScheme];
        // const iconColor = playerTitle?.iconColor?.[colorScheme];

        return {
          labelClassName: styles.playerOption,
          labelStyle: labelColor ? { color: labelColor } : undefined,
          label: (
            <>
              <div className={styles.label}>
                {playerName || '--'}
              </div>

              {/*
                !!playerTitle?.icon &&
                <Svg
                  className={styles.icon}
                  style={iconColor ? { color: iconColor } : undefined}
                  description={playerTitle.iconDescription}
                  src={getResourceUrl(`${playerTitle.icon}.svg`)}
                />
              */}

              {
                !!playerTitle?.icon &&
                <MemberIcon
                  className={styles.icon}
                  member={{
                    name: playerName,
                    showdownUser: true,
                    periods: null,
                  }}
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

  const contextMenuId = useRandomUuid();

  const {
    show: showContextMenu,
    hideAfter,
  } = useContextMenu();

  return (
    <PiconRackProvider dndMuxId={battleId}>
      <div
        ref={containerRef}
        className={cx(
          'showdex-module',
          styles.container,
          containerSize === 'xs' && styles.verySmol,
          containerWidth < 360 && styles.skinnyBoi,
          !!colorScheme && styles[colorScheme],
          renderAsOverlay && styles.overlay,
          glassyTerrain && styles.glassy,
        )}
        onContextMenu={(e) => showContextMenu({
          event: e,
          id: contextMenuId,
        })}
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
              onPress={onCloseOverlay}
            >
              <i className="fa fa-close" />
            </BaseButton>
          }

          {
            (renderAsOverlay && mobile) &&
            <CloseButton
              className={cx(styles.mobileCloseButton, styles.top)}
              onPress={onCloseOverlay}
            />
          }

          <PiconRackSortableContext playerKey={topKey}>
            <PlayerCalc
              className={styles.playerCalc}
              position="top"
              playerKey={topKey}
              defaultName={t('player.user.defaultName', { index: 1 })}
              playerOptions={playerOptions}
              mobile={mobile}
            />
          </PiconRackSortableContext>

          <FieldCalc
            className={styles.fieldCalc}
            playerKey={topKey}
            opponentKey={bottomKey}
          />

          <PiconRackSortableContext playerKey={bottomKey}>
            <PlayerCalc
              className={styles.opponentCalc}
              position="bottom"
              playerKey={bottomKey}
              defaultName={t('player.user.defaultName', { index: 2 })}
              playerOptions={playerOptions}
              mobile={mobile}
            />
          </PiconRackSortableContext>

          {
            (renderAsOverlay && mobile) &&
            <CloseButton
              className={cx(styles.mobileCloseButton, styles.bottom)}
              onPress={onCloseOverlay}
            />
          }
        </Scrollable>
      </div>

      <ContextMenu
        id={contextMenuId}
        itemKeyPrefix={`Calcdex:${battleId}:ContextMenu`}
        items={[
          {
            key: 'switch-sides',
            entity: 'item',
            props: {
              label: t('contextMenu.switchSides', 'Switch Players'),
              icon: 'fa-random',
              disabled: typeof room?.switchViewpoint !== 'function'
                || (!!authPlayerKey && battleActive), // no effect in this case
              onPress: hideAfter(() => room.switchViewpoint()),
            },
          },
          {
            key: 'dupe-calcdex',
            entity: 'item',
            props: {
              label: t('contextMenu.convertHonk', 'Convert to Honk'),
              icon: 'fa-car',
              disabled: !battleId || typeof onRequestHonkdex !== 'function',
              hidden: !honkdexSettings?.visuallyEnabled,
              onPress: hideAfter(() => {
                const newId = uuidv4();

                dupeCalcdex({ ...state, newId });
                onRequestHonkdex(newId);
              }),
            },
          },
          {
            key: 'close-hr',
            entity: 'separator',
          },
          {
            key: 'open-hellodex',
            entity: 'item',
            props: {
              label: t('contextMenu.openHellodex', 'Hellodex'),
              icon: 'fa-home',
              iconStyle: { transform: 'scale(1.2)' },
              disabled: typeof onRequestHellodex !== 'function',
              onPress: hideAfter(onRequestHellodex),
            },
          },
          {
            key: 'close-calcdex',
            entity: 'item',
            props: {
              theme: renderAsOverlay ? 'info' : 'error',
              label: t(`contextMenu.close${renderAsOverlay ? 'Overlay' : 'Tab'}`, 'Close'),
              icon: 'close-circle',
              disabled: !battleId
                || (renderAsOverlay && typeof onCloseOverlay !== 'function'),
              //  || (!renderAsOverlay && typeof app?.leaveRoom !== 'function'),
              hidden: !renderAsOverlay,
              onPress: hideAfter(() => {
                if (renderAsOverlay) {
                  return void onCloseOverlay();
                }

                app.leaveRoom(getCalcdexRoomId(battleId));
              }),
            },
          },
        ]}
      />
    </PiconRackProvider>
  );
};
