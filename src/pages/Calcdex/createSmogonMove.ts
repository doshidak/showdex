import { Move as SmogonMove } from '@smogon/calc';
import type { GenerationNum, MoveName } from '@pkmn/data';

export const createSmogonMove = (
  gen: GenerationNum,
  moveName: MoveName,
  criticalHit?: boolean,
): SmogonMove => {
  if (!gen || !moveName) {
    return null;
  }

  const smogonMove = new SmogonMove(gen, moveName);

  if (smogonMove && criticalHit) {
    smogonMove.isCrit = true;
  }

  return smogonMove;
};
