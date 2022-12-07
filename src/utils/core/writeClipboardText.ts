/**
 * Browser-agnostic abstraction for `navigator.clipboard.writeText()`.
 *
 * * Actually, this is just for completion's sake since `readClipboardText()` exists.
 *   - Calling the aforementioned function works both on Chrome and Firefox, fortunately.
 *
 * @since 1.0.7
 */
export const writeClipboardText = (
  data: string,
): Promise<void> => {
  if (typeof navigator === 'undefined') {
    return;
  }

  return navigator.clipboard.writeText(data);
};
