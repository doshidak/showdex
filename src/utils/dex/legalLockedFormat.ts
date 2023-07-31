import { LegalLockedFormats } from '@showdex/consts/dex';
import { getGenlessFormat } from './getGenlessFormat';

/**
 * Determines if the provided `format` should be locked to legal values.
 *
 * * Does not take into account any user settings, which should take precedence
 *   over this value if the corresponding setting is specified.
 *
 * @since 1.0.3
 */
export const legalLockedFormat = (format: string) => {
  if (!format || !LegalLockedFormats.length) {
    return false;
  }

  // e.g., 'gen9vgc2023series1' -> 'vgc2023series1'
  const genlessFormat = getGenlessFormat(format);

  return LegalLockedFormats.some((f) => {
    // reject any formats that's just '//' lol
    // '//'.slice(1, -1) -> '' (empty string) btw
    if (f.startsWith('/') && f.endsWith('/') && f.slice(1, -1).length) {
      return new RegExp(f.slice(1, -1), 'i').test(genlessFormat);
    }

    return genlessFormat.endsWith(f);
  });
};
