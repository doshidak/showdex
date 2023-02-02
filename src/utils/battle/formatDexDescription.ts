import { times } from '@showdex/consts/core';

/**
 * Internally-used list of `replace()` formatters, where `regex` corresponds to the first argument and
 * `replacement` to the second.
 *
 * * `formatDexDescription()` will replace matching regexes in the order that they're defined!
 *
 * @since 1.0.3
 */
const DexDescriptionFormatters: { regex: RegExp; replacement: string; }[] = [
  { regex: /Abilit(y|ies)/, replacement: 'abilit$1' },
  { regex: /Nature(s)?/, replacement: 'nature$1' },
  { regex: /Item(s)?/, replacement: 'item$1' },
  { regex: /KOes/, replacement: 'KOs' },
  { regex: /supereffective/, replacement: 'super effective' },
  { regex: /(?<=\s+)and(?=\s+)/, replacement: '&' },
  { regex: /(?<=\d)x(?=[.,:;!?\s])/i, replacement: times },
  { regex: /1\/2[\w\s]+max\s+HP/, replacement: '50% HP' },
  { regex: /1\/3[\w\s]+max\s+HP/, replacement: '33% HP' },
  { regex: /1\/4[\w\s]+max\s+HP/, replacement: '25% HP' },
  { regex: /1\/5[\w\s]+max\s+HP/, replacement: '20% HP' },
  { regex: /1\/6[\w\s]+max\s+HP/, replacement: '16% HP' },
  { regex: /1\/8[\w\s]+max\s+HP/, replacement: '12% HP' },
  { regex: /1\/10[\w\s]+max\s+HP/, replacement: '10% HP' },
  { regex: /1\/16[\w\s]+max\s+HP/, replacement: '6% HP' },
  { regex: /(?:(?<!Special\s+|Sp\.?\s+)Attack(?!s)|(?<!Sp\.?\s+)Atk(?=[.,:;!?\s]))/, replacement: 'ATK' },
  { regex: /(?:(?<!Special\s+|Sp\.?\s+)Defense(?!s)|(?<!Sp\.?\s+)Def(?=[.,:;!?\s]))/, replacement: 'DEF' },
  { regex: /(?:Special\s+Attack|Sp\.?\s+Atk|SpA(?=[.,:;!?\s]))/, replacement: 'SPA' },
  { regex: /(?:Special\s+Defense|Sp\.?\s+Def|SpD(?=[.,:;!?\s]))/, replacement: 'SPD' },
  { regex: /(?:Speed(?!s)|Spe(?=[.,:;!?\s]))/, replacement: 'SPE' },
];

/**
 * Formats a description provided from the global `Dex` object.
 *
 * * Formatted string is meant to be displayed in a tooltip.
 *
 * @since 1.0.3
 */
export const formatDexDescription = (description: string): string => {
  if (!description) {
    return null;
  }

  return DexDescriptionFormatters.reduce((prev, formatter) => {
    const {
      regex,
      replacement,
    } = formatter;

    return prev.replace(regex, replacement);
  }, description);
};
