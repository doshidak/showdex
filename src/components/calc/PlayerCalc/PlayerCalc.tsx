import * as React from 'react';
import { useTranslation } from 'react-i18next';
import cx from 'classnames';
import { PlayerPiconButton } from '@showdex/components/calc';
import { type RackGridProps, DroppableGrid } from '@showdex/components/layout';
import { ContextMenu, useContextMenu } from '@showdex/components/ui';
import { type DropdownOption } from '@showdex/components/form';
import { PiconRackContext } from '@showdex/components/layout';
import { type CalcdexPlayerKey } from '@showdex/interfaces/calc';
import { useColorScheme } from '@showdex/redux/store';
import { clamp, env } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { useRandomUuid } from '@showdex/utils/hooks';
import { CalcdexPokeProvider } from '../CalcdexPokeContext';
import { useCalcdexContext } from '../CalcdexContext';
import { PlayerInfo } from '../PlayerInfo';
import { PokeCalc } from '../PokeCalc';
import { SideControls } from '../SideControls';
import styles from './PlayerCalc.module.scss';

export interface PlayerCalcProps {
  className?: string;
  style?: React.CSSProperties;
  position?: 'top' | 'bottom';
  playerKey?: CalcdexPlayerKey;
  defaultName?: string;
  playerOptions?: DropdownOption<CalcdexPlayerKey>[];
  mobile?: boolean;
}

const l = logger('@showdex/components/calc/PlayerCalc');

export const PlayerCalc = ({
  className,
  style,
  position = 'top',
  playerKey = 'p1',
  defaultName = '--',
  playerOptions,
  mobile,
}: PlayerCalcProps): JSX.Element => {
  const { t } = useTranslation('calcdex');
  const colorScheme = useColorScheme();

  const {
    state,
    settings,
    removePokemon,
    dupePokemon,
    movePokemon,
    selectPokemon,
    activatePokemon,
  } = useCalcdexContext();

  const {
    operatingMode,
    renderMode,
    containerSize,
    containerWidth,
    format,
    gameType,
  } = state;

  const minPokemonKey = (operatingMode === 'battle' && 'calcdex-player-min-pokemon')
    || (operatingMode === 'standalone' && 'honkdex-player-min-pokemon')
    || null;

  const minPokemon = (!!minPokemonKey && env.int(minPokemonKey)) || 0;
  const playerState = React.useMemo(() => state[playerKey] || {}, [playerKey, state]);

  const {
    pokemon: playerParty,
    maxPokemon,
    activeIndices: playerActives,
    // selectionIndex: playerIndex,
  } = playerState;

  const {
    show: showContextMenu,
    hideAfter,
  } = useContextMenu();

  const piconMenuId = useRandomUuid();
  const [contextPiconId, setContextPiconId] = React.useState<string>(null);

  const contextPokemonIndex = React.useMemo(() => (
    contextPiconId
      ? playerParty.findIndex((p) => p?.calcdexId === contextPiconId)
      : null
  ), [
    contextPiconId,
    playerParty,
  ]);

  const contextPokemon = (contextPokemonIndex ?? -1) > -1
    && playerParty[contextPokemonIndex];

  const rackCtx = React.useContext(PiconRackContext);
  const itemIds = rackCtx[playerKey] || [];

  const {
    // itemKeyPrefix,
    lastAddedId,
    gridSpecs,
    makeItemId,
    extractPlayerKey,
    extractPokemonId,
  } = rackCtx;

  const renderItem = React.useCallback<RackGridProps<React.ReactNode>['renderItem']>((
    id,
    sortable,
  ) => {
    const pkey = extractPlayerKey?.(id, true);
    const pid = extractPokemonId?.(id) || id;

    const party = state?.[pkey]?.pokemon || [];
    const partyIndex = party?.findIndex((p) => p?.calcdexId === pid) ?? -1;
    const targetIndex = partyIndex > -1 ? partyIndex : clamp(0, sortable?.itemIndex ?? party.length, party.length);

    return (
      <PlayerPiconButton
        key={`PlayerCalc:PlayerPiconButton:${playerKey}:${pid}`}
        // ref={sortable?.setActivatorNodeRef}
        player={state?.[pkey]}
        pokemon={partyIndex}
        operatingMode={operatingMode}
        format={format}
        showNickname={settings?.showNicknames}
        dragging={sortable?.dragging}
        itemIndex={partyIndex < 0 ? sortable?.itemIndex : undefined} // for showing the selection over the "new" Pokemon slot
        nativeProps={operatingMode === 'standalone' ? {
          ...sortable?.attributes,
          ...sortable?.listeners,
        } : undefined}
        onPress={() => selectPokemon(
          playerKey,
          targetIndex,
          `${l.scope}:PlayerPiconButton~SelectionIndex:onPress()`,
        )}
        onContextMenu={operatingMode === 'standalone' && partyIndex > -1 ? (e) => {
          showContextMenu?.({ id: piconMenuId, event: e });
          setContextPiconId(pid);
          e.stopPropagation();
        } : undefined}
      />
    );
  }, [
    extractPlayerKey,
    extractPokemonId,
    format,
    operatingMode,
    playerKey,
    piconMenuId,
    selectPokemon,
    settings?.showNicknames,
    showContextMenu,
    state,
  ]);

  return (
    <div
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        containerSize === 'xs' && styles.verySmol,
        ['xs', 'sm'].includes(containerSize) && styles.smol,
        ['md', 'lg', 'xl'].includes(containerSize) && styles.big,
        (containerSize === 'xl' || containerWidth > 990) && styles.veryThicc,
        containerWidth < 360 && styles.skinnyBoi,
        (mobile && renderMode === 'overlay') && styles.mobileOverlay,
        operatingMode === 'standalone' && styles.standalone,
        className,
      )}
      style={style}
    >
      <div className={styles.playerBar}>
        {
          operatingMode === 'battle' &&
          <PlayerInfo
            className={styles.playerInfo}
            position={position}
            playerKey={playerKey}
            defaultName={defaultName}
            playerOptions={playerOptions}
            mobile={mobile}
          />
        }

        {
          operatingMode === 'standalone' &&
          <SideControls
            className={styles.sideControls}
            playerKey={playerKey}
          />
        }

        <DroppableGrid
          containerClassName={styles.teamList}
          itemIds={itemIds}
          itemKeyPrefix={makeItemId(playerKey, 'droppable')}
          renderItem={renderItem}
          editable={operatingMode === 'standalone' && !!itemIds.length}
          lastAddedId={lastAddedId}
          focusedId={contextPiconId}
          gridSpecs={gridSpecs}
        >
          {(
            Array(clamp(0, clamp(maxPokemon || 0, minPokemon) - itemIds.length))
              .fill(null)
              .map((_, i) => {
                const itemIndex = itemIds.length + i;

                return renderItem(
                  makeItemId(playerKey, String(itemIndex)),
                  { itemIndex },
                );
              })
          )}
        </DroppableGrid>
      </div>

      <CalcdexPokeProvider playerKey={playerKey}>
        <PokeCalc
          className={styles.pokeCalc}
        />
      </CalcdexPokeProvider>

      <ContextMenu
        id={piconMenuId}
        itemKeyPrefix="PlayerCalc:Picon:ContextMenu"
        items={[
          // {
          //   key: 'select-pokemon',
          //   entity: 'item',
          //   props: {
          //     label: 'Select',
          //     icon: 'fa-mouse-pointer',
          //     hidden: contextPokemon?.calcdexId === playerParty?.[playerIndex]?.calcdexId,
          //     disabled: typeof contextPokemonIndex !== 'number',
          //     onPress: hideAfter(() => selectPokemon(playerKey, contextPokemonIndex)),
          //   },
          // },
          {
            key: 'active-pokemon',
            entity: 'item',
            props: {
              theme: contextPokemon?.active ? 'info' : 'default',
              label: t('player.party.contextMenu.activatePokemon', 'Active'),
              icon: contextPokemon?.active ? 'ghost-boo' : 'ghost-smile',
              iconStyle: { strokeWidth: 4, transform: 'scale(1.2)' },
              disabled: typeof contextPokemonIndex !== 'number',
              hidden: operatingMode !== 'standalone',
              onPress: hideAfter(() => {
                const indices = [...(playerActives || [])]
                  .filter((i) => contextPokemonIndex !== i || !contextPokemon.active);

                if (!contextPokemon.active && !indices.includes(contextPokemonIndex)) {
                  indices.push(contextPokemonIndex);
                }

                activatePokemon(playerKey, indices.slice(-(gameType === 'Doubles' ? 2 : 1)));
              }),
            },
          },
          {
            key: 'action-hr',
            entity: 'separator',
            props: {
              hidden: operatingMode !== 'standalone',
            },
          },
          {
            key: 'new-pokemon',
            entity: 'item',
            props: {
              label: t('player.party.contextMenu.addPokemon', 'New'),
              icon: 'fa-plus',
              hidden: operatingMode !== 'standalone' || !contextPokemon?.calcdexId,
              onPress: hideAfter(() => selectPokemon(playerKey, playerParty.length)),
            },
          },
          {
            key: 'dupe-pokemon',
            entity: 'item',
            props: {
              label: t('player.party.contextMenu.dupePokemon', 'Duplicate'),
              icon: 'copy-plus',
              iconStyle: { strokeWidth: 4, transform: 'scale(1.2)' },
              disabled: !contextPokemon?.calcdexId,
              hidden: operatingMode !== 'standalone',
              onPress: hideAfter(() => dupePokemon(playerKey, contextPokemon)),
            },
          },
          {
            key: 'move-pokemon',
            entity: 'item',
            props: {
              label: t('player.party.contextMenu.movePokemon', {
                side: playerKey === 'p1' ? 'B' : 'A',
                defaultValue: `Move to ${playerKey === 'p1' ? 'B' : 'A'}`,
              }),
              icon: `fa-arrow-${playerKey === 'p1' ? 'down' : 'up'}`,
              disabled: !contextPokemon?.calcdexId,
              hidden: operatingMode !== 'standalone',
              onPress: hideAfter(() => movePokemon(
                playerKey,
                contextPokemon,
                playerKey === 'p1' ? 'p2' : 'p1',
              )),
            },
          },
          {
            key: 'delete-hr',
            entity: 'separator',
            props: {
              hidden: operatingMode !== 'standalone',
            },
          },
          {
            key: 'delete-pokemon',
            entity: 'item',
            props: {
              theme: 'error',
              label: t('player.party.contextMenu.removePokemon', 'Delete'),
              // icon: 'fa-times-circle',
              icon: 'trash-close',
              iconStyle: { transform: 'scale(1.2)' },
              disabled: !contextPokemon?.calcdexId,
              hidden: operatingMode !== 'standalone',
              onPress: hideAfter(() => removePokemon(playerKey, contextPokemon, true)),
            },
          },
        ]}
        disabled={operatingMode === 'standalone'}
        onVisibilityChange={(visible) => {
          if (visible || contextPiconId) {
            return;
          }

          setContextPiconId(null);
        }}
      />
    </div>
  );
};
