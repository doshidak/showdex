import { describe, expect, it } from 'vitest';
import { detectUnpickedPokemon } from './detectUnpickedPokemon';

const mon = (calcdexId: string, ident?: string) => ({ calcdexId, speciesForme: calcdexId, ident: ident || null });
const byId = (a: { calcdexId?: string }, b: { calcdexId?: string }) => !!a?.calcdexId && a.calcdexId === b?.calcdexId;

// 12-mon Team Preview roster, none switched in yet
const preview = Array.from({ length: 12 }, (_, i) => mon(`m${i + 1}`));

const base = {
  teamPreviewCount: 6,
  previewCount: 12,
  battleStarted: true,
  pickedPokemon: null as ReturnType<typeof mon>[],
  revealedIds: [] as string[],
  pokemon: preview,
  isSamePokemon: byId,
};

describe('detectUnpickedPokemon()', () => {
  describe('your side (picked Pokemon from the request)', () => {
    it('drops every roster mon that isn\'t one of the 6 picks once the battle starts', () => {
      const picked = ['m2', 'm4', 'm6', 'm8', 'm10', 'm12'].map((id) => mon(id));

      expect(detectUnpickedPokemon({ ...base, pickedPokemon: picked }).sort())
        .toEqual(['m1', 'm11', 'm3', 'm5', 'm7', 'm9'].sort());
    });

    it('waits until the request actually lists the picked team', () => {
      expect(detectUnpickedPokemon({ ...base, pickedPokemon: preview })).toEqual([]);
    });

    it('does nothing before the battle starts', () => {
      const picked = preview.slice(0, 6);

      expect(detectUnpickedPokemon({ ...base, battleStarted: false, pickedPokemon: picked })).toEqual([]);
    });
  });

  describe('opponent\'s side (or spectating)', () => {
    it('keeps the full preview list until 6 different mons have switched in', () => {
      expect(detectUnpickedPokemon({ ...base, revealedIds: ['m1', 'm2', 'm3', 'm4', 'm5'] })).toEqual([]);
    });

    it('drops the never-revealed preview mons once 6 different mons have switched in', () => {
      expect(detectUnpickedPokemon({ ...base, revealedIds: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'] }).sort())
        .toEqual(['m10', 'm11', 'm12', 'm7', 'm8', 'm9'].sort());
    });

    it('counts each revealed mon once', () => {
      expect(detectUnpickedPokemon({ ...base, revealedIds: ['m1', 'm2', 'm3', 'm4', 'm5', 'm1'] })).toEqual([]);
    });

    it('ignores revealed ids that aren\'t in the roster', () => {
      expect(detectUnpickedPokemon({ ...base, revealedIds: ['m1', 'm2', 'm3', 'm4', 'm5', 'zzz'] })).toEqual([]);
    });

    it('doesn\'t treat a reconstructed ident as revealed (Calcdex state fills those in for preview mons too)', () => {
      const identified = preview.map((p) => mon(p.calcdexId, `p2: ${p.calcdexId}`));

      expect(detectUnpickedPokemon({ ...base, pokemon: identified, revealedIds: ['m1', 'm2'] })).toEqual([]);
    });
  });

  describe('formats it leaves alone', () => {
    it('ignores bring-6-pick-4 (VGC)', () => {
      expect(detectUnpickedPokemon({
        ...base,
        teamPreviewCount: 4,
        previewCount: 6,
        revealedIds: ['m1', 'm2', 'm3', 'm4'],
        pokemon: preview.slice(0, 6),
      })).toEqual([]);
    });

    it('ignores formats w/o a pick count', () => {
      expect(detectUnpickedPokemon({
        ...base,
        teamPreviewCount: 0,
        previewCount: 6,
        pokemon: preview.slice(0, 6),
      })).toEqual([]);
    });

    it('ignores formats where the preview is no bigger than the team', () => {
      expect(detectUnpickedPokemon({ ...base, previewCount: 6, pokemon: preview.slice(0, 6) })).toEqual([]);
    });
  });
});
