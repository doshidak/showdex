import * as React from 'react';
import { useTranslation } from 'react-i18next';
import cx from 'classnames';
import { v4 as uuidv4 } from 'uuid';
import {
  BattleInfo,
  FieldCalc,
  PlayerCalc,
  useCalcdexContext,
  useCalcdexSize,
} from '@showdex/components/calc';
import { BuildInfo } from '@showdex/components/debug';
import { PiconRackProvider, PiconRackSortableContext } from '@showdex/components/layout';
import { ContextMenu, Scrollable, useContextMenu } from '@showdex/components/ui';
import { type CalcdexBattleState } from '@showdex/interfaces/calc';
import { useCalcdexDuplicator, useColorScheme, useGlassyTerrain } from '@showdex/redux/store';
import { getHonkdexRoomId } from '@showdex/utils/app';
import { useRandomUuid } from '@showdex/utils/hooks';
import styles from './Honkdex.module.scss';

export interface HonkdexProps {
  onRequestHellodex?: () => void;
  onRequestHonkdex?: (instanceId?: string, initState?: Partial<CalcdexBattleState>) => void;
}

export const Honkdex = ({
  onRequestHellodex,
  onRequestHonkdex,
}: HonkdexProps): JSX.Element => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useCalcdexSize(containerRef);

  const { t } = useTranslation('honkdex');
  const colorScheme = useColorScheme();
  const glassyTerrain = useGlassyTerrain();
  const { state, saving, saveHonk } = useCalcdexContext();
  const dupeCalcdex = useCalcdexDuplicator();

  const {
    battleId,
    name,
    playerKey,
    opponentKey,
    switchPlayers,
    cached,
  } = state;

  const topKey = switchPlayers ? opponentKey : playerKey;
  const bottomKey = topKey === playerKey ? opponentKey : playerKey;

  const {
    show: showContextMenu,
    hideAfter,
  } = useContextMenu();

  const contextMenuId = useRandomUuid();

  return (
    <PiconRackProvider dndMuxId={state?.battleId}>
      <div
        ref={containerRef}
        className={cx(
          'showdex-module',
          styles.container,
          !!colorScheme && styles[colorScheme],
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

          <BattleInfo
            className={styles.battleInfo}
            onRequestHonkdex={onRequestHonkdex}
          />

          <PiconRackSortableContext playerKey={topKey}>
            <PlayerCalc
              className={styles.playerCalc}
              position="top"
              playerKey={topKey}
              defaultName="Side A"
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
              defaultName="Side B"
            />
          </PiconRackSortableContext>
        </Scrollable>
      </div>

      <ContextMenu
        id={contextMenuId}
        itemKeyPrefix={`Honkdex:${battleId}:ContextMenu`}
        items={[
          {
            key: 'save-honkdex',
            entity: 'item',
            props: {
              theme: saving?.[0] ? 'info' : cached ? 'success' : 'default',
              label: t(
                `contextMenu.${saving?.[0] ? 'saving' : cached ? 'saved' : 'save'}`,
                saving?.[0] ? 'Saving...' : cached ? 'Saved' : 'Save',
              ),
              icon: 'floppy',
              iconStyle: { strokeWidth: 3, transform: 'scale(1.2)' },
              disabled: !name || saving?.[0],
              onPress: hideAfter(saveHonk),
            },
          },
          {
            key: 'dupe-honkdex',
            entity: 'item',
            props: {
              label: t('contextMenu.dupeHonkdex', 'Duplicate'),
              icon: 'copy-plus',
              iconStyle: { strokeWidth: 3, transform: 'scale(1.2)' },
              onPress: hideAfter(() => {
                const newId = uuidv4();

                dupeCalcdex({ ...state, newId });
                onRequestHonkdex(newId);
              }),
            },
          },
          {
            key: 'close-separator',
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
            key: 'close-room',
            entity: 'item',
            props: {
              theme: 'info',
              label: t('contextMenu.close', 'Close'),
              icon: 'close-circle',
              disabled: !battleId || typeof app?.leaveRoom !== 'function',
              onPress: hideAfter(() => app.leaveRoom(getHonkdexRoomId(battleId))),
            },
          },
        ]}
      />
    </PiconRackProvider>
  );
};
