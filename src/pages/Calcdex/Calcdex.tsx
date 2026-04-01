/**
 * @file `Calcdex.tsx`
 * @author Keith Choison <keith@tize.io>
 * @since 0.1.0
 */

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
import { PageContainer, PiconRackProvider, PiconRackSortableContext } from '@showdex/components/layout';
import { BaseButton, ContextMenu, useContextMenu } from '@showdex/components/ui';
import { type CalcdexPlayerKey, CalcdexPlayerKeys as AllPlayerKeys } from '@showdex/interfaces/calc';
import {
  useCalcdexDuplicator,
  useColorScheme,
  useHonkdexSettings,
  useShowdexBundles,
} from '@showdex/redux/store';
import { findPlayerTitle } from '@showdex/utils/app';
import { useMobileViewport, useRandomUuid } from '@showdex/utils/hooks';
import styles from './Calcdex.module.scss';

export interface CalcdexProps {
  onUserPopup?: (username?: string) => void;
  onRequestHellodex?: () => void;
  onRequestHonkdex?: (instanceId?: string) => void;
  onSwitchViewpoint?: () => void;
  onCloseOverlay?: () => void;
  onLeaveRoom?: () => void;
}

export const Calcdex = ({
  onUserPopup,
  onRequestHellodex,
  onRequestHonkdex,
  onSwitchViewpoint,
  onCloseOverlay,
  onLeaveRoom,
}: CalcdexProps): React.JSX.Element => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useCalcdexSize(containerRef);

  const { t } = useTranslation('calcdex');
  const colorScheme = useColorScheme();
  const bundles = useShowdexBundles();
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

  const dupeCalcdex = useCalcdexDuplicator();

  const playerOptions = React.useMemo<DropdownOption<CalcdexPlayerKey>[]>(() => (
    playerCount > 2 && AllPlayerKeys
      .filter((k) => state[k]?.active)
      .map((k) => {
        const { name: playerName } = state[k];
        const playerTitle = findPlayerTitle(playerName, { showdownUser: true, titles: bundles.titles, tiers: bundles.tiers });
        const labelColor = playerTitle?.color?.[colorScheme];

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
    bundles.tiers,
    bundles.titles,
    colorScheme,
    playerCount,
    state,
    t,
  ]);

  const renderAsOverlay = React.useMemo(() => renderMode === 'overlay', [renderMode]);

  const topKey = React.useMemo(() => (
    !!authPlayerKey
      && playerKey === authPlayerKey
      && (
        (settings?.authPosition === 'bottom' && opponentKey)
          || (settings?.authPosition === 'auto' && ((playerKey === 'p1' && playerKey) || opponentKey))
      )
  ) || (!authPlayerKey && switchPlayers ? opponentKey : playerKey), [
    authPlayerKey,
    opponentKey,
    playerKey,
    settings?.authPosition,
    switchPlayers,
  ]);

  const bottomKey = React.useMemo(() => (
    topKey === playerKey
      ? opponentKey
      : playerKey
  ), [
    opponentKey,
    playerKey,
    topKey,
  ]);

  const contextMenuId = useRandomUuid();

  const {
    show: showContextMenu,
    hideAfter,
  } = useContextMenu();

  return (
    <PiconRackProvider dndMuxId={battleId}>
      <PageContainer
        ref={containerRef}
        name="calcdex"
        className={cx(
          styles.container,
          renderAsOverlay && styles.overlay,
          mobile && styles.mobile,
          containerSize === 'xs' && styles.verySmol,
          containerWidth < 380 && styles.skinnyBoi,
        )}
        contentClassName={styles.content}
        prefix={<BuildInfo position="top-right" />}
        contentScrollable
        onContextMenu={(e) => void showContextMenu({
          event: e,
          id: contextMenuId,
        })}
      >
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
            onUserPopup={onUserPopup}
          />
        </PiconRackSortableContext>

        <FieldCalc
          className={cx(
            styles.fieldCalc,
            (settings?.expandFieldControls || state?.gameType === 'Doubles') && styles.expanded,
          )}
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
            onUserPopup={onUserPopup}
          />
        </PiconRackSortableContext>

        {
          (renderAsOverlay && mobile) &&
          <CloseButton
            className={cx(styles.mobileCloseButton, styles.bottom)}
            onPress={onCloseOverlay}
          />
        }
      </PageContainer>

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
              disabled: typeof onSwitchViewpoint !== 'function'
                || (!!authPlayerKey && battleActive), // no effect in this case
              onPress: hideAfter(onSwitchViewpoint),
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
                || (renderAsOverlay && typeof onCloseOverlay !== 'function')
                || (!renderAsOverlay && typeof onLeaveRoom !== 'function'),
              hidden: !renderAsOverlay,
              onPress: hideAfter(() => void (renderAsOverlay ? onCloseOverlay : onLeaveRoom)()),
            },
          },
        ]}
      />
    </PiconRackProvider>
  );
};
