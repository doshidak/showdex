import { type GenerationNum, type MoveName } from '@smogon/calc';
import { type CalcdexBattleField, type CalcdexPokemon } from '@showdex/interfaces/calc';
import { getDexForFormat, getDynamicMoveType } from '@showdex/utils/dex';
import { chunkStepQueueTurns } from './chunkStepQueueTurns';

/**
 * Creates a mapping of the `pokemon`'s successfully used moves with their types from the provided `stepQueue[]`.
 *
 * * This mapping determines whether to activate the Stellar STAB mechanic introduced in Gen 9 DLC 2.
 * * Primarily used to populate the `stellarMoveMap` in `syncBattle()`.
 * * Note that the Terastallization properties in `pokemon` aren't checked before populating the map.
 * * Guaranteed to return an empty object.
 *
 * @since 1.2.0
 */
export const mapStellarMoves = (
  pokemon: CalcdexPokemon,
  stepQueue: string[],
  config?: {
    format?: string | GenerationNum;
    field?: CalcdexBattleField,
  },
): Partial<Record<Showdown.TypeName, MoveName>> => {
  if (!pokemon?.speciesForme || !pokemon.playerKey || !stepQueue?.length) {
    return {};
  }

  const {
    format,
    field,
  } = config || {};

  const {
    speciesForme,
    playerKey,
  } = pokemon;

  // e.g., speciesForme = 'Thundurus-Therian' -> 'Thundurus'
  // (we're just partial matching the stepQueue[] strings anyway)
  const smolForme = speciesForme.replace(/-.+$/, '');

  // e.g., smolForme = 'Thundurus', playerKey = 'p1' -> /\|p1[a-z]?:\s?Thundurus/i
  const identRegex = new RegExp(`\\|${playerKey}[a-z]?:\\s?${smolForme}`, 'i');

  // look for the turn (also conveniently the index in `chunks[]`) that the `pokemon` Terastallized into Stellar type
  const chunks = chunkStepQueueTurns(stepQueue);
  const stellarIndex = chunks.findIndex((c) => c.some((s) => s.startsWith('|-terastallize|') && identRegex.test(s) && s.endsWith('|Stellar')));

  // note: index 0 is always the battle init steps, which will be empty if not present in the `stepQueue[]`
  if (stellarIndex < 1) {
    return {};
  }

  const dex = getDexForFormat(format);
  const stellarChunks = chunks.slice(stellarIndex);
  const output: Partial<Record<Showdown.TypeName, MoveName>> = {};

  // basically looking for the existence of both steps in each chunk:
  // '|move|<ident>|<MoveName>|<target>|<effect>' &
  // '|-damage|<target>|<hp>/<maxhp>'
  stellarChunks.forEach((chunk) => {
    const moveStepIndex = chunk.findIndex((s) => s.startsWith(`|move|${playerKey}`) && identRegex.test(s));

    if (moveStepIndex < 0) {
      return;
    }

    const [
      , // ''
      , // 'move'
      , // <ident>
      movePart,
      target,
    ] = chunk[moveStepIndex].split('|');

    const damageStep = chunk.slice(moveStepIndex + 1).find((s) => s.startsWith(`|-damage|${target}`));

    if (!damageStep) {
      return;
    }

    const dexMove = dex.moves.get(movePart);
    const moveName = (dexMove?.exists && dexMove.name as MoveName) || null;

    const type = getDynamicMoveType(pokemon, moveName, {
      format,
      field,
    }) || dexMove?.type;

    // note: we're only interested in the **first** successful move of the current `type` (hence the second conditional)
    if (!type || output[type]) {
      return;
    }

    output[type] = moveName;
  });

  return output;
};
