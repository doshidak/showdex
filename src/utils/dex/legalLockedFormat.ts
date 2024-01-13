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

  // update (2024/01/12): following the v1.2.1 release, people started having an issue with getGenlessFormat() returning
  // null (resulting in their Calcdex/Honkdex crashing with an 'endsWith' of null TypeError); after going Sherlock
  // Holmes on dis bich, turns out it's caused by named Teambuilder teams & boxes without a format, which gets parsed
  // as 'gen9', which is the only condition (other than `format` being falsy, which we already checked for) that
  // results in null... but anyway, this is fine cause 'gen9' is definitely not legal locked LOL
  return !!genlessFormat && LegalLockedFormats.some((f) => (
    typeof f === 'string'
      ? genlessFormat.endsWith(f)
      : f?.test(genlessFormat)
  ));
};
