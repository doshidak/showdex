import { LegalLockedFormats } from '@showdex/consts/battle';

/**
 * Determines if the provided `format` should be locked to legal values.
 *
 * * Does not take into account any user settings, which should take precedence
 *   over this value if the corresponding setting is specified.
 *
 * @since 1.0.3
 */
export const legalLockedFormat = (format: string) => !!format
  && LegalLockedFormats.some((f) => format.endsWith(f));
