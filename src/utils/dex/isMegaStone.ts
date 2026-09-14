import { formatId } from '@showdex/utils/core';

/**
 * Whether the given `item` is a Mega stone.
 *
 * * Mega stones end in `'ite'` (e.g. Venusaurite, Blastoisinite) or `'ite X'`/`'ite Y'`/`'ite Z'` (Charizardite X/Y,
 *   Mewtwonite X/Y, Garchompite Z) -- with the lone exception of `'Eviolite'` (an NFE item, not a Mega stone).
 * * Name-based (the same heuristic the PS client uses) so it doesn't depend on the client `Dex` populating
 *   `megaStone`/`requiredItem`, which it doesn't at runtime.
 *
 * @since 1.4.0
 */
export const isMegaStone = (item: string): boolean => {
  const id = formatId(item);

  return !!id && id !== 'eviolite' && /ite[xyz]?$/.test(id);
};
