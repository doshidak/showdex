/**
 * @file `Honkdex.tsx`
 * @author Keith Choison <keith@tize.io>
 * @since 1.2.0
 */

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useDebouncyFn } from 'use-debouncy';
import { v4 as uuidv4 } from 'uuid';
import {
  type BattleInfoProps,
  BattleInfo,
  FieldCalc,
  PlayerCalc,
  useCalcdexContext,
  useCalcdexSize,
} from '@showdex/components/calc';
import { BuildInfo } from '@showdex/components/debug';
import { Composer } from '@showdex/components/form';
import { PageContainer, PiconRackProvider, PiconRackSortableContext } from '@showdex/components/layout';
import { ContextMenu, useContextMenu } from '@showdex/components/ui';
import { useCalcdexDuplicator } from '@showdex/redux/store';
import { logger } from '@showdex/utils/debug';
import { useRandomUuid } from '@showdex/utils/hooks';
import styles from './Honkdex.module.scss';

export interface HonkdexProps {
  onRequestHellodex?: () => void;
  onRequestHonkdex?: BattleInfoProps['onRequestHonkdex'];
  onLeaveRoom?: () => void;
}

const l = logger('@showdex/pages/Honkdex');

export const Honkdex = ({
  onRequestHellodex,
  onRequestHonkdex,
  onLeaveRoom,
}: HonkdexProps): React.JSX.Element => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useCalcdexSize(containerRef);

  const { t } = useTranslation('honkdex');
  const {
    state,
    saving,
    updateBattle,
    saveHonk,
  } = useCalcdexContext();
  const debouncyUpdateBattle = useDebouncyFn(updateBattle, 1000);
  const dupeCalcdex = useCalcdexDuplicator();

  const {
    battleId,
    name,
    playerKey,
    opponentKey,
    switchPlayers,
    notes,
    cached,
  } = state || {};

  const topKey = switchPlayers ? opponentKey : playerKey;
  const bottomKey = topKey === playerKey ? opponentKey : playerKey;

  const {
    show: showContextMenu,
    hideAfter,
  } = useContextMenu();

  const contextMenuId = useRandomUuid();

  return (
    <PiconRackProvider dndMuxId={state?.battleId}>
      <PageContainer
        ref={containerRef}
        name="honkdex"
        scrollableContentClassName={styles.content}
        prefix={<BuildInfo className={styles.buildInfo} position="top-right" />}
        contentScrollable
        onContextMenu={(e) => void showContextMenu({
          event: e,
          id: contextMenuId,
        })}
      >
        <BattleInfo
          className={styles.battleInfo}
          onRequestHonkdex={onRequestHonkdex}
          onLeaveRoom={onLeaveRoom}
        />

        {
          notes?.pre?.visible &&
          <Composer
            hint={t('notedex:editor.hint', 'Type something...')}
            initialEditorState={notes?.pre?.editorState}
            meta={{}}
            input={{
              name: `${l.scope}:${battleId}:Notes:Pre:EditorState`,
              value: notes?.pre?.editorState,
              onChange: (value: string) => void debouncyUpdateBattle({
                notes: { pre: { editorState: value } },
              }, `${l.scope}:${battleId}:Notes:Pre:EditorState~Composer:input.onChange()`),
              onBlur: () => void 0,
              onFocus: () => void 0,
            }}
          />
        }

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

        {
          notes?.post?.visible &&
          <Composer
            hint={t('notedex:editor.hint', 'Type something...')}
            initialEditorState={notes?.post?.editorState}
            meta={{}}
            input={{
              name: `${l.scope}:${battleId}:Notes:Post:EditorState`,
              value: notes?.post?.editorState,
              onChange: (value: string) => void debouncyUpdateBattle({
                notes: { post: { editorState: value } },
              }, `${l.scope}:${battleId}:Notes:Post:EditorState~Composer:input.onChange()`),
              onBlur: () => void 0,
              onFocus: () => void 0,
            }}
          />
        }
      </PageContainer>

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
              disabled: !battleId || typeof onLeaveRoom !== 'function',
              onPress: hideAfter(onLeaveRoom),
            },
          },
        ]}
      />
    </PiconRackProvider>
  );
};
