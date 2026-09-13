import { describe, expect, it } from 'vitest';
import { determineFollowedCalcdexRoomId } from './determineFollowedCalcdexRoomId';

// mirrors the preact host's room ids, e.g., 'battle-gen9ou-1' -> 'calcdex-battle-gen9ou-1'
const toCalcdexRoomId = (battleId: string) => `calcdex-${battleId}`;
const isCalcdexRoomId = (roomId: string) => roomId?.startsWith('calcdex-');

const base = {
  enabled: true,
  singlePanel: false,
  focusedRoomId: 'battle-gen9ou-2',
  panelRoomIds: ['calcdex-battle-gen9ou-1'],
  openRoomIds: ['battle-gen9ou-1', 'calcdex-battle-gen9ou-1', 'battle-gen9ou-2', 'calcdex-battle-gen9ou-2'],
  toCalcdexRoomId,
  isCalcdexRoomId,
};

describe('determineFollowedCalcdexRoomId()', () => {
  it('swaps in the focused battle\'s Calcdex when another battle\'s Calcdex is showing', () => {
    expect(determineFollowedCalcdexRoomId(base)).toBe('calcdex-battle-gen9ou-2');
  });

  it('checks every visible panel, not just the first', () => {
    expect(determineFollowedCalcdexRoomId({
      ...base,
      panelRoomIds: ['rooms', 'calcdex-battle-gen9ou-1'],
    })).toBe('calcdex-battle-gen9ou-2');
  });

  it('does nothing when the setting is off', () => {
    expect(determineFollowedCalcdexRoomId({ ...base, enabled: false })).toBeNull();
  });

  it('does nothing in single-panel mode', () => {
    expect(determineFollowedCalcdexRoomId({ ...base, singlePanel: true })).toBeNull();
  });

  it('does nothing when the focused room isn\'t a battle', () => {
    expect(determineFollowedCalcdexRoomId({ ...base, focusedRoomId: 'hellodex' })).toBeNull();
  });

  it('does nothing when the focused battle has no Calcdex tab open (e.g., closed or overlay mode)', () => {
    expect(determineFollowedCalcdexRoomId({
      ...base,
      openRoomIds: base.openRoomIds.filter((id) => id !== 'calcdex-battle-gen9ou-2'),
    })).toBeNull();
  });

  it('never replaces a panel that isn\'t showing a Calcdex (Hellodex, chat, etc.)', () => {
    expect(determineFollowedCalcdexRoomId({ ...base, panelRoomIds: ['hellodex'] })).toBeNull();
    expect(determineFollowedCalcdexRoomId({ ...base, panelRoomIds: [] })).toBeNull();
  });

  it('does nothing when the focused battle\'s Calcdex is already showing', () => {
    expect(determineFollowedCalcdexRoomId({
      ...base,
      panelRoomIds: ['calcdex-battle-gen9ou-1', 'calcdex-battle-gen9ou-2'],
    })).toBeNull();
  });

  it('works w/ the classic host\'s formatted room ids too', () => {
    expect(determineFollowedCalcdexRoomId({
      ...base,
      panelRoomIds: ['view-calcdex-battlegen9ou1'],
      openRoomIds: ['battle-gen9ou-1', 'view-calcdex-battlegen9ou1', 'battle-gen9ou-2', 'view-calcdex-battlegen9ou2'],
      toCalcdexRoomId: (battleId) => `view-calcdex-${battleId.replace(/[^a-z0-9]/g, '')}`,
      isCalcdexRoomId: (roomId) => roomId?.startsWith('view-calcdex-'),
    })).toBe('view-calcdex-battlegen9ou2');
  });
});
