import { formatId } from '@showdex/utils/core';
import { isMegaStone } from './isMegaStone';

/**
 * Captures the letter suffix of a lettered Mega forme, e.g., the `X` in `'Charizard-Mega-X'` or the `Z` in
 * `'Garchomp-Mega-Z'` (plain `'-Mega'` formes don't match).
 *
 * @since 1.4.2
 */
const MegaFormeSuffix = /-Mega-([XYZ])$/i;

/**
 * Picks the Mega forme that the held `item` Mega Evolves into from the provided `megaFormes`.
 *
 * * Lettered stones pick the forme w/ the matching letter, e.g., *Charizardite X* -> `'Charizard-Mega-X'` &
 *   *Garchompite Z* -> `'Garchomp-Mega-Z'`.
 * * Plain stones pick the unlettered forme, e.g., *Garchompite* -> `'Garchomp-Mega'` (not `'Garchomp-Mega-Z'`).
 * * Falls back to the first provided forme if none match, or returns `null` if the `item` isn't a Mega stone or no
 *   `megaFormes` were provided.
 *
 * @example
 * ```ts
 * getMegaFormeForItem('Garchompite Z', ['Garchomp-Mega', 'Garchomp-Mega-Z']); // 'Garchomp-Mega-Z'
 * getMegaFormeForItem('Garchompite', ['Garchomp-Mega-Z', 'Garchomp-Mega']); // 'Garchomp-Mega'
 * getMegaFormeForItem('Leftovers', ['Garchomp-Mega']); // null
 * ```
 * @since 1.4.2
 */
export const getMegaFormeForItem = (
  item: string,
  megaFormes: string[],
): string => {
  if (!isMegaStone(item) || !megaFormes?.length) {
    return null;
  }

  const stoneSuffix = formatId(item).match(/ite([xyz])$/)?.[1] || null;

  return megaFormes.find((forme) => (
    (forme?.match(MegaFormeSuffix)?.[1]?.toLowerCase() || null) === stoneSuffix
  )) || megaFormes[0];
};
