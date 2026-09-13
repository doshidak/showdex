import { type CalcdexPokemon } from '@showdex/interfaces/calc';

/**
 * Minimal shape of a Pokemon that `detectUnpickedPokemon()` needs.
 *
 * @since 1.4.2
 */
export type UnpickedPokemonLike = Partial<Pick<CalcdexPokemon, 'calcdexId' | 'ident' | 'speciesForme'>>;

/**
 * Arguments for `detectUnpickedPokemon()`.
 *
 * @since 1.4.2
 */
export interface DetectUnpickedPokemonConfig {
  /** Number of Pokemon each player picks at Team Preview, i.e., the client's `battle.teamPreviewCount`. */
  teamPreviewCount: number;
  /** Number of Pokemon this player's Team Preview listed. */
  previewCount: number;
  /** Whether the battle has actually started (i.e., Team Preview's over & the picks are locked in). */
  battleStarted: boolean;
  /**
   * The authenticated player's picked Pokemon, typically `battle.myPokemon[]` from the latest request.
   *
   * * Only provide this for the authenticated player's own side; leave it `null` for the opponent's or when spectating.
   */
  pickedPokemon?: UnpickedPokemonLike[];
  /**
   * `calcdexId`'s of this player's Pokemon that have actually switched in.
   *
   * * Derive these from the client's `Showdown.Pokemon`'s, which only get a `searchid` once they've switched in --
   *   not from the Calcdex state, whose `ident` gets reconstructed for Team Preview Pokemon too.
   * * Only used for the opponent's side (or when spectating), i.e., when `pickedPokemon` isn't provided.
   */
  revealedIds?: string[];
  /** Current Calcdex roster for this player. */
  pokemon: UnpickedPokemonLike[];
  /** Whether two Pokemon are the same Pokemon, e.g., matching `calcdexId`'s or `similarPokemon()`. */
  isSamePokemon: (a: UnpickedPokemonLike, b: UnpickedPokemonLike) => boolean;
}

/**
 * Detects the `calcdexId`'s of Pokemon that were shown at Team Preview but aren't part of the team that was picked.
 *
 * * Only applies to formats where a full team is picked out of a bigger Team Preview, e.g., *Bring 12 Pick 6*.
 *   - Formats like VGC's *Bring 6 Pick 4* are deliberately left alone so their unbrought Pokemon can still be calc'd.
 * * For the authenticated player's own side, unpicked Pokemon are known as soon as the request lists the picked team.
 * * For the opponent's side (or when spectating), they're only known once enough different Pokemon have switched in,
 *   at which point any Pokemon that was never revealed must've been left out.
 * * Returns an empty array when there's nothing to remove (yet).
 *
 * @since 1.4.2
 */
export const detectUnpickedPokemon = ({
  teamPreviewCount,
  previewCount,
  battleStarted,
  pickedPokemon,
  revealedIds,
  pokemon,
  isSamePokemon,
}: DetectUnpickedPokemonConfig): string[] => {
  const pickCount = teamPreviewCount || 0;

  // only formats that pick a full team out of a bigger Team Preview (e.g., B12P6, not VGC's B6P4)
  if (pickCount < 6 || (previewCount || 0) <= pickCount || !battleStarted || !pokemon?.length) {
    return [];
  }

  // authenticated player's own side: the request tells us exactly which Pokemon were picked
  if (pickedPokemon?.length) {
    if (pickedPokemon.length !== pickCount) {
      return [];
    }

    return pokemon
      .filter((p) => !!p?.calcdexId && !pickedPokemon.some((picked) => isSamePokemon(p, picked)))
      .map((p) => p.calcdexId);
  }

  // opponent's side (or spectating): wait until enough different Pokemon in the roster have been revealed
  const rosterIds = new Set(pokemon.map((p) => p?.calcdexId).filter(Boolean));
  const revealed = new Set((revealedIds || []).filter((id) => rosterIds.has(id)));

  if (revealed.size < pickCount) {
    return [];
  }

  return pokemon
    .filter((p) => !!p?.calcdexId && !revealed.has(p.calcdexId))
    .map((p) => p.calcdexId);
};
