import slugify from 'slugify';
import { env } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import type { GenerationNum } from '@smogon/calc';

export type SmogonUniversityDexCategory =
  | 'pokemon'
  | 'moves'
  | 'abilities'
  | 'items'
  | 'types'
  | 'formats';

const l = logger('@showdex/utils/app/openSmogonUniversity');

const SmogonUniversityGenSlugs: string[] = [
  null, // gen 0? kekw
  'rb', // gen 1: red/blue
  'gs', // gen 2: gold/silver
  'rs', // gen 3: ruby/sapphire
  'dp', // gen 4: diamond/pearl
  'bw', // gen 5: black/white
  'xy', // gen 6: x/y
  'sm', // gen 7: sun/moon
  'ss', // gen 8: sword/shield
  // 'sv', // gen 9: scarlet/violet (TBD)
];

const SmogonUniversityFormatSlugs: Record<string, string> = {
  '1v1': '1v1',
  '2v2doubles': '2v2-doubles',
  almostanyability: 'almost-any-ability',
  anythinggoes: 'ag',
  balancedhackmons: 'balanced-hackmons',
  battlesadiumsingles: 'battle-stadium-singles',
  bdspou: 'bdsp-ou',
  camomons: 'camomons',
  cap: 'cap',
  doubles: 'doubles',
  godlygift: 'godly-gift',
  mixandmega: 'mix-and-mega',
  monotype: 'monotype',
  nationaldex: 'national-dex',
  nationaldexag: 'national-dex-ag',
  nationaldexmonotype: 'national-dex-monotype',
  nfe: 'nfe',
  ou: 'ou',
  pu: 'pu',
  ru: 'ru',
  stabmons: 'stabmons',
  ubers: 'uber',
  uu: 'uu',
  vgc2017: 'vgc17',
  vgc2018: 'vgc18',
  vgc2019: 'vgc19',
  vgc2020: 'vgc20',
  vgc2021: 'vgc21',
  vgc2022: 'vgc22',
  zu: 'zu',
};

/**
 * `windowFeatures` passed to the built-in `window.open()`.
 *
 * @warning Do not specify `'noreferrer'`, or else none of the other window features (like `width` and `height`) will be applied!
 * @warning Do not specify `'noopener'`, or else `window.opener` will return `null` instead of the desired `Window`!
 * @since 0.1.2
 */
const SmogonUniversityWindowFeatures = [
  'top=0',
  `left=${typeof window === 'undefined' ? 0 : (window.screen?.width ?? 960) - 960}`,
  'width=800',
  'height=800',
  'resizable',
  'scrollbars',
  'status',
].join(',');

/**
 * Opens a popup window for the requested Smogon University page.
 *
 * @param name Depending on the `category`, could be `speciesForme` for `'pokemon'`, `ItemName` for `'items'`, etc. Not required though.
 * @param format Only used when the `category` is `'pokemon'`. Could be `'ou'`, `'bdsp-ou'`, etc. Not required though.
 * @since 0.1.2
 */
export const openSmogonUniversity = (
  gen: GenerationNum,
  category: SmogonUniversityDexCategory,
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
    l.warn(
      'you forgot to provide the category, dummy!',
      '\n', 'gen', gen,
      '\n', 'category', category,
      '\n', 'name', name,
      '\n', 'format', format,
    );

    return null;
  }

  const genSlug = SmogonUniversityGenSlugs[gen];

  if (!genSlug) {
    l.warn(
      'no valid slug for the passed-in gen was found. you must be playing some version from the future!',
      '\n', 'genSlug', genSlug,
      '\n', 'gen', gen,
      '\n', 'category', category,
      '\n', 'name', name,
      '\n', 'format', format,
    );

    return null;
  }

  const slugifiedName = name ? slugify(name, {
    lower: true,
    trim: true,
  }) : null;

  // we need to do some special parsing for the format,
  // cause they're not consistent between Showdown and Smogon, unfortunately
  const actualFormat = format ? format.replace(`gen${gen}`, '').toLowerCase() : null; // e.g., 'gen8bdspou' -> 'bdspou'

  let slugifiedFormat = actualFormat in SmogonUniversityFormatSlugs ?
    SmogonUniversityFormatSlugs[actualFormat] :
    null;

  if (!slugifiedFormat) {
    if (actualFormat.includes('doubles')) {
      slugifiedFormat = SmogonUniversityFormatSlugs.doubles;
    } else if (actualFormat.includes('monotype')) {
      slugifiedFormat = SmogonUniversityFormatSlugs.monotype;
    }
  }

  const windowUrl = [
    env('smogon-university-dex-url'),
    genSlug,
    category,
    slugifiedName,
    slugifiedFormat,
  ].filter(Boolean).join('/');

  return window.open(
    windowUrl,
    'SmogonUniversity',
    SmogonUniversityWindowFeatures,
  );
};
