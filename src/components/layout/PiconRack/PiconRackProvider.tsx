import * as React from 'react';
import {
  type CollisionDetection,
  type DndContextProps,
  closestCenter,
  // closestCorners,
  DndContext,
  getFirstCollision,
  KeyboardSensor,
  MeasuringFrequency,
  // MeasuringStrategy,
  MouseSensor,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { PlayerPiconButton, useCalcdexContext } from '@showdex/components/calc';
import {
  // type CalcdexBattleState,
  type CalcdexPlayerKey,
  type CalcdexPokemon,
  CalcdexPlayerKeys,
} from '@showdex/interfaces/calc';
// import { clonePokemon, reassignPokemon } from '@showdex/utils/battle';
// import { calcMaxPokemon } from '@showdex/utils/calc';
import { nonEmptyObject, similarArrays } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { useRandomUuid } from '@showdex/utils/hooks';
// import { DndMuxContext } from '../DndMux';
import { type PiconRackContextValue, type PiconRackPlayerOrdering, PiconRackContext } from './PiconRackContext';
import { DragOverlayModule } from '../RackGrid';

export interface PiconRackProviderProps {
  dndMuxId?: string;
  itemKeyPrefix?: string;
  children: React.ReactNode;
}

const l = logger('@showdex/components/layout/PiconRackProvider');

/**
 * Manages the ordering of manually sortable `Picon`'s (Pokemon icons) for each player.
 *
 * @since 1.2.3
 */
export const PiconRackProvider = ({
  dndMuxId = 'PiconRack:DndMux',
  itemKeyPrefix = 'picon',
  children,
}: PiconRackProviderProps): JSX.Element => {
  const {
    state,
    settings,
    updateBattle,
    movePokemon,
  } = useCalcdexContext();

  const randomId = useRandomUuid();
  const sortableId = `${itemKeyPrefix || ''}:sortable:${randomId}`;

  const columns = React.useMemo(() => (
    state?.operatingMode === 'standalone' && (
      // (state?.containerSize === 'xs' && 12)
      ((state?.containerSize === 'xl' || (state?.containerWidth || 0) > 990) && 4)
        || (['md', 'lg'].includes(state?.containerSize) && 3)
    )
  ) || 6, [
    state?.containerSize,
    state?.containerWidth,
    state?.operatingMode,
  ]);

  const makeItemId = React.useCallback<PiconRackContextValue['makeItemId']>((
    playerKey,
    pokemonId,
  ) => `${itemKeyPrefix || ''}:${playerKey}:${pokemonId}`, [
    itemKeyPrefix,
  ]);

  const parsePlayerParty = React.useCallback((
    playerKey: CalcdexPlayerKey,
    pokemon?: CalcdexPokemon[],
  ) => (
    (pokemon || state?.[playerKey]?.pokemon || [])
      .map((p) => !!p?.calcdexId && makeItemId(playerKey, p.calcdexId))
      .filter(Boolean)
  ), [
    makeItemId,
    state,
  ]);

  const containerIds = React.useRef(
    CalcdexPlayerKeys.reduce((prev, key) => {
      prev[key] = makeItemId(key, 'sortable');

      return prev;
    }, {} as PiconRackContextValue['containerIds']),
  );

  const [playerOrdering, setPlayerOrdering] = React.useState(
    CalcdexPlayerKeys.reduce((prev, key) => {
      prev[key] = parsePlayerParty(key);

      return prev;
    }, {} as PiconRackPlayerOrdering),
  );

  const handlingDrag = React.useRef(false);

  React.useEffect(() => {
    if (handlingDrag.current) {
      return;
    }

    const mutations = CalcdexPlayerKeys.reduce((prev, key) => {
      const current = playerOrdering[key];
      const next = parsePlayerParty(key);

      if (similarArrays(current, next)) {
        return prev;
      }

      prev[key] = next;

      return prev;
    }, {} as Partial<PiconRackPlayerOrdering>);

    if (!nonEmptyObject(mutations)) {
      return;
    }

    setPlayerOrdering((prev) => ({
      ...prev,
      ...mutations,
    }));
  }, [ // eslint-disable-line react-hooks/exhaustive-deps
    // parsePlayerParty,
    // playerOrdering,
    state?.p1?.pokemon,
    state?.p2?.pokemon,
    state?.p3?.pokemon,
    state?.p4?.pokemon,
  ]);

  const itemIds = Object.keys(playerOrdering);

  const dndMuxTest = React.useMemo(
    () => new RegExp(`^${itemKeyPrefix || ''}:(p\\d):`),
    [itemKeyPrefix],
  );

  // const extractPlayerKey = React.useCallback<PiconRackContextValue['extractPlayerKey']>((
  //   id,
  // ) => dndMuxTest.exec(String(id || ''))?.[1] as CalcdexPlayerKey, [
  //   dndMuxTest,
  // ]);

  const extractPlayerKey = React.useCallback<PiconRackContextValue['extractPlayerKey']>((
    id,
    detectOnly,
  ) => {
    const detectedKey = dndMuxTest.exec(String(id || ''))?.[1] as CalcdexPlayerKey;
    const pid = String(id || '').replace(dndMuxTest, '') || null;

    if (!pid || detectOnly) {
      return detectedKey;
    }

    const matchedKey = Object.entries(playerOrdering)
      .find(([, oids]) => oids.some((oid) => oid?.includes(pid)))
      ?.[0] as CalcdexPlayerKey;

    return matchedKey || detectedKey;
  }, [
    dndMuxTest,
    playerOrdering,
  ]);

  const extractPokemonId = React.useCallback<PiconRackContextValue['extractPokemonId']>((
    id,
  ) => String(id || '').replace(dndMuxTest, '') || null, [
    dndMuxTest,
  ]);

  const [overlayId, setOverlayId] = React.useState<string>(null);
  const [lastAddedId, setLastAddedId] = React.useState<string>(null);

  const overlayPlayerKey = (!!overlayId && extractPlayerKey(overlayId, true)) || null;
  const overlayPlayer = (!!overlayPlayerKey && state?.[overlayPlayerKey]) || null;
  const overlayPokemonId = (!!overlayId && extractPokemonId(overlayId)) || null;

  const overlayPokemonIndex = React.useMemo(() => (
    overlayPokemonId
      ? (overlayPlayer?.pokemon?.findIndex((p) => p?.calcdexId === overlayPokemonId) ?? -1)
      : -1
  ), [
    overlayPlayer?.pokemon,
    overlayPokemonId,
  ]);

  const resetDnd = React.useCallback(() => {
    setPlayerOrdering(
      CalcdexPlayerKeys.reduce((prev, key) => {
        prev[key] = parsePlayerParty(key);

        return prev;
      }, {} as PiconRackPlayerOrdering),
    );

    if (overlayId) {
      setOverlayId(null);
    }

    // if (lastAddedId) {
    //   setLastAddedId(null);
    // }

    handlingDrag.current = false;
  }, [
    overlayId,
    parsePlayerParty,
  ]);

  const recentlyMovedSides = React.useRef(false);
  const prevOverId = React.useRef<string>(null);

  // React.useEffect(() => void requestAnimationFrame(() => {
  //   recentlyMovedSides.current = false;
  // }), [
  //   playerOrdering,
  // ]);

  // const {
  //   collision,
  //   addInput,
  // } = React.useContext(DndMuxContext);

  const sensors = useSensors(
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }), // distance required otherwise clicking breaks
    useSensor(TouchSensor),
  );

  const collision = React.useCallback<CollisionDetection>((
    args,
  ) => {
    const pointerIntersections = pointerWithin(args);
    const intersections = (!!pointerIntersections.length && pointerIntersections) || rectIntersection(args);

    let overId = getFirstCollision(intersections, 'id')?.toString();

    // l.debug(
    //   'collision()', 'overId', overId,
    //   '\n', 'args', args,
    // );

    if (!overId) {
      if (recentlyMovedSides.current) {
        prevOverId.current = overId;
      }

      return [!!prevOverId.current && { id: prevOverId.current }].filter(Boolean);
    }

    // if a Picon is dragged to the other side, find the colliding Picon on that side
    if (Object.values(containerIds.current).includes(overId)) {
      const overKey = extractPlayerKey(overId);
      const items = playerOrdering[overKey];

      if (items?.length) {
        overId = closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter((c) => (
            !!c?.id?.toString()
              && String(c?.id) !== overId
              && items.includes(String(c.id))
          )),
        })[0]?.id?.toString();
      }
    }

    prevOverId.current = overId;

    return [!!overId && { id: overId }].filter(Boolean);
  }, [
    extractPlayerKey,
    playerOrdering,
  ]);

  const handleDragStart = React.useCallback<DndContextProps['onDragStart']>(({
    active,
  }) => {
    // const activePid = extractPokemonId(active?.id);
    const activeId = active?.id?.toString();

    if (!activeId || overlayId === activeId) {
      return;
    }

    setOverlayId(activeId);
    handlingDrag.current = true;
  }, [
    // extractPokemonId,
    overlayId,
  ]);

  const handleDragMove = React.useCallback<DndContextProps['onDragMove']>(({
    active,
    over,
  }) => {
    const activeDetectedKey = extractPlayerKey(active?.id, true);
    const activeKey = extractPlayerKey(active?.id);
    const activePid = extractPokemonId(active?.id);
    const overKey = extractPlayerKey(over?.id);
    const overPid = extractPokemonId(over?.id);

    if (!activeKey || !activePid || !overKey || !overPid) {
      return;
    }

    // const activeIndex = playerOrdering[activeKey]?.findIndex((id) => id?.includes(activePid)) ?? -1;
    // const overIndex = playerOrdering[overKey]?.findIndex((id) => id?.includes(overPid)) ?? -1;
    const activeIndex = playerOrdering[activeKey]?.findIndex((id) => id === String(active.id)) ?? -1;
    const overIndex = playerOrdering[overKey]?.findIndex((id) => id === String(over.id)) ?? -1;

    // const validActiveIndex = activeIndex > -1;
    // const sourceIndex = validActiveIndex
    //   ? activeIndex
    //   : (playerOrdering[overKey]?.findIndex((id) => id?.includes(activePid)) ?? -1);

    // l.debug(
    //   'handleDragMove()',
    //   '\n', 'active', '(raw)', active?.id, '->',
    //   '(pkey)', activeKey, '(detected)', activeDetectedKey, '(pid)', activePid, '(i)', activeIndex,
    //   '\n', 'over', '(raw)', over?.id, '->', '(pkey)', overKey, '(pid)', overPid, '(i)', overIndex,
    // );

    if (activeIndex < 0 || overIndex < 0) {
      return;
    }

    const withinPlayer = activeKey === overKey;

    if (withinPlayer && activeIndex === overIndex) {
      return;
    }

    setPlayerOrdering((prev) => {
      const mutations: Partial<typeof prev> = {};

      if (withinPlayer) {
        // const destKey = validActiveIndex ? activeKey : overKey;

        mutations[overKey] = arrayMove(prev[overKey], activeIndex, overIndex);

        // l.debug(
        //   'handleDragMove()', 'arrayMove()', destKey, sourceIndex, '->', overIndex,
        //   '\n', 'withinPlayer?', withinPlayer, 'validActiveIndex?', validActiveIndex,
        //   '\n', 'mutations[', destKey, ']', mutations[destKey],
        // );

        return { ...prev, ...mutations };
      }

      const activeRect = active.rect?.current?.translated;
      // const activeX = ((activeRect?.left || 0) + ((activeRect?.width || 0) / 2)); // var name made me feel oldge lol
      const activeX = activeRect?.left || 0;
      const overX = (over.rect?.left || 0) + ((over.rect?.width || 0) / 2);

      const activeBeforeOver = activeX < overX;
      const indexOffset = activeBeforeOver ? 0 : 1;
      const destOverIndex = activeKey === overKey && overIndex > activeIndex
        ? (overIndex - 1) + indexOffset
        : overIndex + indexOffset;

      mutations[activeKey] = [...prev[activeKey]];
      mutations[activeKey].splice(activeIndex, 1);

      mutations[overKey] = [...prev[overKey]];
      mutations[overKey].splice(destOverIndex, 0, String(active.id));

      return { ...prev, ...mutations };
    });

    recentlyMovedSides.current = activeDetectedKey !== activeKey;
  }, [
    extractPlayerKey,
    extractPokemonId,
    playerOrdering,
  ]);

  const handleDragEnd = React.useCallback<DndContextProps['onDragEnd']>(({
    active,
    over,
  }) => {
    const activeId = active?.id?.toString();
    const overId = over?.id?.toString();

    const sourceKey = extractPlayerKey(activeId);
    const activeKey = extractPlayerKey(activeId, true);
    const activePid = extractPokemonId(activeId);
    const overKey = extractPlayerKey(overId, true);
    const overPid = extractPokemonId(overId);

    if (!sourceKey || !activeKey || !activePid || !overKey || !overPid) {
      return void resetDnd();
    }

    // const sourceIndex = playerOrdering[sourceKey]?.findIndex((id) => id?.includes(activePid)) ?? -1;
    // const activeIndex = playerOrdering[activeKey]?.findIndex((id) => id?.includes(activePid)) ?? -1;
    // const overIndex = playerOrdering[overKey]?.findIndex((id) => id?.includes(overPid)) ?? -1;
    const sourceIndex = playerOrdering[sourceKey]?.findIndex((id) => id === activeId) ?? -1;
    const activeIndex = playerOrdering[activeKey]?.findIndex((id) => id === activeId) ?? -1;
    const overIndex = playerOrdering[overKey]?.findIndex((id) => id === overId) ?? -1;

    // const validActiveIndex = (activeIndex ?? -1) > -1;
    // const sourceKey = validActiveIndex ? activeKey : overKey;
    // const sourceIndex = validActiveIndex
    //   ? activeIndex
    //   : playerOrdering[sourceKey]?.findIndex((id) => id?.includes(activePid));

    // l.debug(
    //   'handleDragEnd()',
    //   '\n', 'active', '(raw)', activeId, '->', '(pkey)', activeKey, '(pid)', activePid, '(i)', activeIndex,
    //   '\n', 'source', '(pkey)', sourceKey, '(i)', sourceIndex,
    //   '\n', 'over', '(raw)', overId, '->', '(pkey)', overKey, '(pid)', overPid, '(i)', overIndex,
    //   '\n', 'playerOrdering', playerOrdering,
    // );

    // note: we're allowing -1 overIndex values on purpose since we don't rely on this for indexing
    // (also there's a certain edge case that's being handled too)
    if (sourceIndex < 0) {
      return void resetDnd();
    }

    const withinPlayer = sourceKey === activeKey && activeKey === overKey;

    // if (withinPlayer && sourceIndex === overIndex) {
    //   return void resetDnd();
    // }

    const activeParty = state?.[activeKey]?.pokemon || [];
    const overParty = state?.[overKey]?.pokemon || [];
    const activePartyIndex = activeParty.findIndex((p) => p?.calcdexId === activePid) ?? -1;

    // const playersPayload: Partial<CalcdexBattleState> = {};
    // const orderingMutations: Partial<PiconRackPlayerOrdering> = {};

    // gets the job done
    /*
    setPlayerOrdering((prev) => {
      const mutations: Partial<PiconRackPlayerOrdering> = {};

      if (withinPlayer) {
        mutations[activeKey] = arrayMove(prev[activeKey], activeIndex, overIndex);

        playersPayload[activeKey] = {
          pokemon: arrayMove(activeParty, activePartyIndex, overIndex).map((p, i) => ({ ...p, slot: i })),
          selectionIndex: overIndex,
        };

        updateBattle({
          [activeKey]: {
            pokemon: arrayMove(activeParty, activePartyIndex, overIndex).map((p, i) => ({ ...p, slot: i })),
            selectionIndex: overIndex,
          },
        }, `${l.scope}:handleDragEnd()`);

        setLastAddedId(activeId);

        return { ...prev, ...mutations };
      }

      // no need for this as it's already up-to-date from handleDragMove()
      // mutations[sourceKey] = [...prev[sourceKey]];
      // mutations[sourceKey].splice(sourceIndex, 1)

      const clonedPokemon = clonePokemon(activeParty[activePartyIndex]);

      if (!clonedPokemon.speciesForme) {
        return prev;
      }

      // playersPayload[activeKey] = { pokemon: [...activeParty] };
      // playersPayload[activeKey].pokemon.splice(activeIndex, 1);

      playersPayload[activeKey] = {
        pokemon: [...activeParty].filter((p) => !!p?.calcdexId && p.calcdexId !== activePid),
      };

      if (state?.[activeKey]?.selectionIndex === activePartyIndex) {
        playersPayload[activeKey].selectionIndex = clamp(
          0,
          state[activeKey].selectionIndex,
          playersPayload[activeKey].pokemon.length - 1,
        );
      }

      playersPayload[activeKey].maxPokemon = calcMaxPokemon(
        state?.[activeKey],
        playersPayload[activeKey].pokemon.length,
      );

      // mutations[activeKey] = parsePlayerParty(activeKey, playersPayload[activeKey].pokemon);

      const alreadyMoved = activePid === overPid && activeIndex < 0 && overIndex < 0;
      const destKey = alreadyMoved ? sourceKey : overKey; // already checked withinPlayer
      const destParty = alreadyMoved ? state?.[destKey]?.pokemon : overParty;
      const destIndex = alreadyMoved
        ? sourceIndex
        : overPid.startsWith('droppable:')
          ? (destParty?.length || 0)
          : overIndex;

      const movedPokemon = reassignPokemon(clonedPokemon, destKey, true);

      playersPayload[destKey] = {
        pokemon: [...destParty].filter((p) => !!p?.calcdexId && p.calcdexId !== activePid),
        selectionIndex: destIndex,
      };

      playersPayload[destKey].pokemon.splice(destIndex, 0, movedPokemon);
      mutations[destKey] = parsePlayerParty(destKey, playersPayload[destKey].pokemon);

      playersPayload[destKey].maxPokemon = calcMaxPokemon(
        state?.[destKey],
        playersPayload[destKey].pokemon.length,
      );

      setLastAddedId(mutations[destKey]?.[destIndex] || null);

      // return { ...prev, ...mutations };
      return prev;
    });
    */

    // final implementation
    if (withinPlayer) {
      updateBattle({
        [activeKey]: {
          pokemon: arrayMove(activeParty, activePartyIndex, overIndex).map((p, i) => ({ ...p, slot: i })),
          selectionIndex: overIndex,
        },
      }, `${l.scope}:handleDragEnd()`);

      setPlayerOrdering((prev) => ({
        ...prev,
        [activeKey]: arrayMove(prev[activeKey], activeIndex, overIndex),
      }));

      setLastAddedId(activeId);
      setOverlayId(null);
      handlingDrag.current = false;

      return;
    }

    // unique edge case where handleDragMove() already moved the activeId to the otherKey's ordering,
    // so dnd-kit will report that it was dropped on itself (i.e., no drop target), though at this point,
    // we know it exists from the embedded playerKey's in the IDs (sourceKey & sourceIndex)... which I'm now kinda
    // regretting doing lol (made this shit wayyyyy more complicated than it needs to be tbh but o well gg go next)
    const alreadyMoved = activePid === overPid && activeIndex < 0 && overIndex < 0;
    const destKey = alreadyMoved ? sourceKey : overKey; // already checked withinPlayer
    const destParty = alreadyMoved ? state?.[destKey]?.pokemon : overParty;
    const destIndex = alreadyMoved
      ? sourceIndex
      : overPid.startsWith('droppable:')
        ? (destParty?.length || 0)
        : overIndex;

    movePokemon(
      activeKey,
      activePid,
      destKey,
      destIndex,
      `${l.scope}:handleDragEnd()`,
    );

    setLastAddedId(makeItemId(destKey, activePid));

    // mad inefficient lmao
    /*
    const filterIds: string[] = [];

    CalcdexPlayerKeys.forEach((pkey) => {
      const ordering = playerOrdering[pkey] || [];
      // const party = state?.[pkey]?.pokemon || [];
      // const partyIds = party.map((p) => makeItemId(pkey, p?.calcdexId));

      /*
      if (ordering.every((id, i) => partyIds[i] === id)) {
        return;
      }

      if (ordering.length === partyIds.length) {
        playersPayload[pkey] = {
          pokemon: ordering.map((oid) => {
            const pid = extractPokemonId(oid);

            return party.find((p) => p?.calcdexId === pid);
          }),
        };

        return;
      }
      *\/

      playersPayload[pkey] = {
        pokemon: ordering.map((oid) => {
          const pk = extractPlayerKey(oid);
          const pid = extractPokemonId(oid);

          if (filterIds.includes(pid)) {
            return null;
          }

          const cloned = clonePokemon(state?.[pk]?.pokemon?.find((p) => p?.calcdexId === pid));

          if (pk !== pkey) {
            movePokemon(cloned, pkey);
            filterIds.push(pid);
          }

          return cloned;
        }).filter(Boolean),
      };

      orderingMutations[pkey] = parsePlayerParty(pkey, playersPayload[pkey].pokemon);

      playersPayload[pkey].maxPokemon = calcMaxPokemon(
        state?.[pkey]?.maxPokemon,
        playersPayload[pkey].pokemon.length,
      );
    });
    */

    /*
    if (nonEmptyObject(playersPayload)) {
      updateBattle(playersPayload, `${l.scope}:handleDragEnd()`);
      // setPlayerOrdering((p) => ({ ...p, ...orderingMutations }));
    }
    */

    /*
    const [lastFilterId] = filterIds.slice(-1);

    setLastAddedId({
      ...playerOrdering,
      ...orderingMutations,
    }[overKey]?.find?.((id) => id?.includes(lastFilterId)));
    */

    // l.debug(
    //   'handleDragEnd()',
    //   '\n', 'active', '(raw)', activeId, '->', '(pkey)', activeKey, '(pid)', activePid, '(i)', activeIndex,
    //   '\n', 'source', '(pkey)', sourceKey, '(i)', sourceIndex,
    //   '\n', 'over', '(raw)', overId, '->', '(pkey)', overKey, '(pid)', overPid, '(i)', overIndex,
    //   '\n', 'playersPayload', playersPayload,
    //   '\n', 'playerOrdering', '(prev)', playerOrdering,
    // );

    setOverlayId(null);
    handlingDrag.current = false;
  }, [
    extractPlayerKey,
    extractPokemonId,
    makeItemId,
    movePokemon,
    // parsePlayerParty,
    playerOrdering,
    resetDnd,
    state,
    updateBattle,
  ]);

  const value = React.useMemo<PiconRackContextValue>(() => ({
    itemKeyPrefix,
    containerIds: containerIds.current,
    overlayId,
    lastAddedId,

    gridSpecs: {
      columns,
      gridSize: 40,
      gridGap: 0,
    },

    ...playerOrdering,

    makeItemId,
    extractPlayerKey,
    extractPokemonId,
  }), [
    columns,
    extractPlayerKey,
    extractPokemonId,
    itemKeyPrefix,
    lastAddedId,
    makeItemId,
    overlayId,
    playerOrdering,
  ]);

  return (
    <DndContext
      id={dndMuxId}
      sensors={sensors}
      collisionDetection={collision}
      measuring={{
        droppable: {
          frequency: MeasuringFrequency.Optimized, // measures based on droppable.strategy value (default)
          // strategy: MeasuringStrategy.Always, // default: MeasuringStrategy.WhileDragging
        },
      }}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={resetDnd}
    >
      <PiconRackContext.Provider value={value}>
        <SortableContext
          id={sortableId}
          items={itemIds}
        >
          {children}
        </SortableContext>

        <DragOverlayModule
          portal
          gridSpecs={value.gridSpecs}
          dropAnimationDuration={184}
          // dropAnimationFunction="cubic-bezier(0.25, 1, 0.5, 1)"
        >
          {
            overlayPokemonIndex > -1 &&
            <PlayerPiconButton
              player={overlayPlayer}
              pokemon={overlayPokemonIndex}
              operatingMode={state?.operatingMode}
              format={state?.format}
              showNickname={settings?.showNicknames}
              dragging
            />
          }
        </DragOverlayModule>
      </PiconRackContext.Provider>
    </DndContext>
  );
};
