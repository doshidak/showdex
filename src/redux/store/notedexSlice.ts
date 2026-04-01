/**
 * @file `notedexSlice.ts`
 * @author Keith Choison <keith@tize.io>
 * @since 1.3.0
 */

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  type Draft,
  type PayloadAction,
  createSlice,
  current,
} from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { saveNotedex, SaveNotedexActionType } from '@showdex/redux/actions';
import { nonEmptyObject } from '@showdex/utils/core';
import { logger, runtimer } from '@showdex/utils/debug';
import { type ElementSizeLabel } from '@showdex/utils/hooks';
import { useDispatch, useSelector } from './hooks';

/**
 * State for a single Notedex instance.
 *
 * @since 1.3.0
 */
export interface NotedexSliceInstance {
  /**
   * Notedex's instance ID.
   *
   * * No specific format is enforced, but a random-based `v4()` UUID is recommended.
   *
   * @since 1.3.0
   */
  id: string;

  /**
   * Notedex's optional name.
   *
   * @default null
   * @since 1.3.0
   */
  name?: string;

  /**
   * Notedex's auto-generated name.
   *
   * * Indicates if the note should be saved when modified.
   * * Typically populated when a Notedex is duplicated.
   * * Falsy values (default) will default to the placeholder text.
   *   - Otherwise, this value will become the placeholder text.
   *
   * @example
   * ```ts
   * 'Copy of Copy of Copy of Copy of Copy of Copy of Untitled'
   * ```
   * @default null
   * @since 1.3.0
   */
  defaultName?: string;

  /** @todo */
  // teambuilderId?: string;

  /**
   * Stringified Lexical editor state used in the Notedex's `Composer` component.
   *
   * @since 1.3.0
   */
  editorState: string;

  /**
   * Last recorded container size label.
   *
   * @default
   * ```ts
   * 'xs' as ElementSizeLabel
   * ```
   * @since 1.3.0
   */
  containerSize: ElementSizeLabel;

  /**
   * Last recorded container width.
   *
   * @default 0
   * @since 1.3.0
   */
  containerWidth: number;

  /**
   * Unix epoch date of when this Notedex instance was instantiated.
   *
   * @since 1.3.0
   */
  created: number;

  /**
   * Unix epoch date of when this Notedex instance was last modified.
   *
   * @since 1.3.0
   */
  updated: number;

  /**
   * Unix epoch date of when this Notedex instance was last saved.
   *
   * * If `null` (default), this Notedex hasn't been saved yet.
   *
   * @default null
   * @since 1.3.0
   */
  saved?: number;
}

/**
 * Primary state for all things Notedex.
 *
 * @since 1.3.0
 */
export interface NotedexSliceState {
  /**
   * Mapping of Notedex `id`'s (as keys) to their `NotedexSliceInstance` states (as values).
   *
   * @since 1.3.0
   */
  notes: Record<string, NotedexSliceInstance>;
}

/**
 * Reducer function definitions.
 *
 * @since 1.3.0
 */
export interface NotedexSliceReducers {
  /**
   * Initializes an empty Notedex state.
   *
   * @since 1.3.0
   */
  init: (
    state: Draft<NotedexSliceState>,
    action: PayloadAction<Partial<NotedexSliceInstance> & { scope?: string; }>,
  ) => void;

  /**
   * Updates an existing Notedex instance.
   *
   * @since 1.3.0
   */
  update: (
    state: Draft<NotedexSliceState>,
    action: PayloadAction<PickRequired<NotedexSliceInstance, 'id'> & { scope?: string; }>,
  ) => void;

  /**
   * Destroys the specified Notedex instances by their `id`'s.
   *
   * @since 1.3.0
   */
  destroy: (
    state: Draft<NotedexSliceState>,
    action: PayloadAction<{
      scope?: string;
      id: string | string[];
    }>,
  ) => void;

  /**
   * Duplicates the Notedex associated w/ the specified `id`.
   *
   * * `newId` can be specified, otherwise, a random `v4()` UUID will be generated for the new `NotedexSliceInstance`.
   * * `returnRef`, if provided, will be directly mutated to contain the final unique `id`.
   *
   * @since 1.3.0
   */
  dupe: (
    state: Draft<NotedexSliceState>,
    action: PayloadAction<PickRequired<NotedexSliceInstance, 'id'> & {
      scope?: string;
      newId?: string;
      returnRef?: { id: string; };
    }>,
  ) => void;

  /**
   * Restores the provided Notedex instances into the Notedex state.
   *
   * @since 1.3.0
   */
  restore: (
    state: Draft<NotedexSliceState>,
    action: PayloadAction<{
      scope?: string;
      notes: NotedexSliceState['notes'];
    }>,
  ) => void;
}

const l = logger('@showdex/redux/store/notedexSlice');

export const notedexSlice = createSlice({
  name: 'notedex',

  initialState: {
    notes: {},
  },

  reducers: {
    init: (state, action) => {
      const endTimer = runtimer(`notedexSlice.init() via ${action.payload?.scope || '(anon)'}`, l);

      const {
        scope, // used for debugging; not used here, but destructuring it from `...payload`
        ...payload
      } = action.payload || {};

      let noteId = payload.id || uuidv4();

      while (noteId in state.notes) {
        noteId = uuidv4();
      }

      state.notes[noteId] = {
        name: null,
        editorState: null,
        containerSize: 'xs',
        containerWidth: 0,
        ...payload,
        id: noteId,
        created: Date.now(),
        updated: Date.now(),
        saved: null,
      };

      endTimer('(done)');

      l.debug(
        'DONE', action.type, 'from', action.payload?.scope || '(anon)',
        '\n', 'payload', action.payload,
        '\n', 'state', __DEV__ && current(state).notes[noteId],
      );
    },

    update: (state, action) => {
      const endTimer = runtimer(`notedexSlice.update() via ${action.payload?.scope || '(anon)'}`, l);

      const {
        scope,
        id,
        ...payload
      } = action.payload || {};

      if (!id) {
        l.error('Attempted to update a Notedex instance w/ a falsy id.');

        return void endTimer('(no id)');
      }

      if (!(id in state.notes)) {
        l.error('Couldn\'t find a Notedex instance w/ id', id);

        return void endTimer('(bad id)');
      }

      state.notes[id] = {
        ...state.notes[id],
        ...payload,
        updated: Date.now(),
      };

      endTimer('(done)');

      l.debug(
        'DONE', action.type, 'from', action.payload?.scope || '(anon)',
        '\n', 'payload', action.payload,
        '\n', 'state', __DEV__ && current(state).notes[id],
      );
    },

    destroy: (state, action) => {
      const endTimer = runtimer(`notedexSlice.destroy() via ${action.payload?.scope || '(anon)'}`, l);

      const { id: payloadIds } = action.payload || {};
      const noteIds = [...(Array.isArray(payloadIds) ? payloadIds : [payloadIds])].filter(Boolean);

      if (!noteIds.length) {
        return void endTimer('(no ids)');
      }

      noteIds.forEach((id) => {
        if (!(id in state.notes)) {
          return;
        }

        delete state.notes[id];
      });

      endTimer('(done)');

      l.debug(
        'DONE', action.type, 'from', action.payload?.scope || '(anon)',
        '\n', 'noteIds (payload', noteIds,
        '\n', 'state', __DEV__ && current(state),
      );
    },

    dupe: (state, action) => {
      const endTimer = runtimer(`notedexSlice.dupe() via ${action.payload?.scope || '(anon)'}`, l);

      const {
        scope,
        id,
        newId,
        returnRef,
        ...payload
      } = action.payload || {};

      if (!id) {
        l.error('Attempted to duplicate a Notedex instance w/ a falsy id.');

        return void endTimer('(no id)');
      }

      if (!(id in state.notes)) {
        l.error('Couldn\'t find a Notedex instance w/ id', id);

        return void endTimer('(bad id)');
      }

      let noteId = newId || uuidv4();

      while (noteId in state.notes) {
        noteId = uuidv4();
      }

      state.notes[noteId] = {
        ...state.notes[id],
        ...payload,
        id: noteId,
        created: Date.now(),
        updated: Date.now(),
        saved: null,
      };

      if (typeof returnRef === 'object') {
        returnRef.id = noteId;
      }

      endTimer('(done)');

      l.debug(
        'DONE', action.type, 'from', action.payload?.scope || '(anon)',
        '\n', 'payload', action.payload,
        '\n', 'state', __DEV__ && current(state),
      );
    },

    restore: (state, action) => {
      const endTimer = runtimer(`notedexSlice.restore() via ${action.payload?.scope || '(anon)'}`, l);

      const { notes } = action.payload || {};

      if (!nonEmptyObject(notes)) {
        return void endTimer('(no notes)');
      }

      (Object.entries(notes) as Entries<typeof notes>).forEach(([
        noteId,
        noteState,
      ]) => {
        if (!nonEmptyObject(noteState) || noteState.id !== noteId) {
          return;
        }

        state.notes[noteId] = noteState;
      });

      endTimer('(done)');

      l.debug(
        'DONE', action.type, 'from', action.payload?.scope || '(anon)',
        '\n', 'payload', action.payload,
        '\n', 'state', __DEV__ && current(state),
      );
    },
  },

  extraReducers: (build) => void build
    .addCase(saveNotedex.fulfilled, (state, action) => {
      const { id, saved } = action.payload || {};

      if (!id || !saved) {
        return;
      }

      state.notes[id].saved = saved;

      l.debug(
        'DONE', SaveNotedexActionType, 'from', '@showdex/redux/actions/saveNotedex()',
        '\n', 'id', id,
        '\n', 'payload', action.payload,
        '\n', 'state', __DEV__ && current(state).notes[id],
      );
    }),
});

export const useNotedexState = () => useSelector((s) => s?.notedex);
export const useNotedexInstances = () => useSelector((s) => s?.notedex?.notes);
export const useNotedexInstance = (id: string) => useSelector((s) => s?.notedex?.notes?.[id]);

export const useNotedexDuplicator = () => {
  const { t } = useTranslation('notedex');
  const instances = useNotedexInstances();
  const dispatch = useDispatch();

  return React.useCallback((
    instance: PickRequired<NotedexSliceInstance, 'id'> & {
      scope?: string;
      newId?: string;
      returnRef?: { id: string; };
    },
  ) => {
    if (!instance?.id) {
      return;
    }

    dispatch(notedexSlice.actions.dupe({
      scope: `${l.scope}:useNotedexDuplicator() via ${instance.scope || '(anon)'}`,
      id: instance.id,
      newId: instance.newId,
      name: null,
      defaultName: t('toolbar.name.dupe', {
        name: instance.name || instances[instance.id]?.name || t(
          'hellodex:instances.notedex.untitledLabel',
          'untitled note',
        ),
      }),
      returnRef: instance.returnRef,
    }));
  }, [
    dispatch,
    instances,
    t,
  ]);
};
