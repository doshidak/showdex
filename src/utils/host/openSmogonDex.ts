import { type GenerationNum } from '@smogon/calc';
import slugify from 'slugify';
import { GenLabels, SmogonDexFormatSlugs } from '@showdex/consts/dex';
import { env } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { getDexForFormat, getGenlessFormat } from '@showdex/utils/dex';

export type SmogonDexCategory =
  | 'pokemon'
  | 'moves'
  | 'abilities'
  | 'items'
  | 'types'
  | 'formats';

const l = logger('@showdex/utils/host/openSmogonDex()');

/**
 * `windowFeatures` passed to the built-in `window.open()`.
 *
 * @warning Do not specify `'noreferrer'`, or else none of the other window features (like `width` and `height`) will be applied!
 * @warning Do not specify `'noopener'`, or else `window.opener` will return `null` instead of the desired `Window`!
 * @since 0.1.2
 */
const windowFeatures = [
  'top=0',
  `left=${typeof window === 'undefined' ? 0 : (window.screen?.width ?? 960) - 960}`,
  'width=800',
  'height=800',
  'resizable',
  'scrollbars',
  'status',
].join(',');

/**
 * Opens a popup window for the requested Smogon University "StrategyDex" page.
 *
 * @since 0.1.2
 */
export const openSmogonDex = (
  gen: GenerationNum,
  category: SmogonDexCategory,
  name?: string,
  format?: string,
): WindowProxy => {
  if (typeof window === 'undefined') {
    l.warn(
      'could not find the global window object, probably because you\'re running this in a Node.js environment',
      '\n', 'typeof window', typeof window,
      '\n', 'gen', gen,
      '\n', 'category', category,
      '\n', 'name', name,
      '\n', 'format', format,
    );

    return null;
  }

  if (!category) {
    /*
    l.warn(
      'you forgot to provide the category, dummy!',
      '\n', 'gen', gen,
      '\n', 'category', category,
      '\n', 'name', name,
      '\n', 'format', format,
    );
    */

    return null;
  }

  // update (2026/09/12): Champions formats run on gen 9, but live under their own `champions` gen on the Smogon Dex
  // (e.g., https://www.smogon.com/dex/champions/pokemon/baxcalibur/), not `sv`
  const champions = typeof format === 'string' && format.includes('champions');
  const { slug: genSlug } = (champions && { slug: 'champions' }) || GenLabels[gen] || {};

  if (!genSlug || !name) {
    /*
    l.warn(
      'no valid slug for the passed-in gen was found. you must be playing some version from the future!',
      '\n', 'genSlug', genSlug,
      '\n', 'gen', gen,
      '\n', 'category', category,
      '\n', 'name', name,
      '\n', 'format', format,
    );
    */

    return null;
  }

  // the Champions Dex puts a Mega on its base forme's page (under a "Mega" section) rather than giving it its own,
  // so e.g. 'Baxcalibur-Mega' has to link to /baxcalibur/ ('baxcalibur-mega' doesn't exist)
  const dexSpecies = champions && category === 'pokemon'
    ? getDexForFormat(format)?.species.get(name)
    : null;

  const slugifiedName = slugify((dexSpecies?.isMega && dexSpecies.baseSpecies) || name, {
    lower: true,
    trim: true,
  });

  if (!slugifiedName) {
    return null;
  }

  const urlPaths: string[] = [
    env('smogon-university-dex-url'),
    genSlug,
    category,
    slugifiedName,
  ];

  // note: the Champions Dex has no per-format pages to suffix (& a fallback like 'doubles' would 404 there)
  if (category === 'pokemon' && !champions) {
    // we need to do some special parsing for the format,
    // cause they're not consistent between Showdown and Smogon, unfortunately
    const genlessFormat = getGenlessFormat(format); // e.g., 'gen8bdspou' -> 'bdspou'

    const slugifiedFormat = genlessFormat in SmogonDexFormatSlugs
      ? SmogonDexFormatSlugs[genlessFormat]
      : genlessFormat.includes('doubles')
        ? SmogonDexFormatSlugs.doubles
        : genlessFormat.includes('monotype')
          ? SmogonDexFormatSlugs.monotype
          : null;

    if (slugifiedFormat) {
      urlPaths.push(slugifiedFormat);
    }
  }

  return window.open(
    urlPaths.filter(Boolean).join('/'),
    'SmogonStrategyDex',
    windowFeatures,
  );
};
