import { dispatchShowdexEvent } from './dispatchShowdexEvent';
import { env } from './getEnv';

/**
 * Browser-agnostic abstraction for `navigator.clipboard.readText()`.
 *
 * * Primarily exists due to the aforementioned function not being implemented on Firefox due to "security" reasons.
 *   - Only way to read from the user's clipboard on Firefox is through the extension's content script,
 *     communicated via `CustomEvent`s.
 * * Just works on Chrome tho! ...Imagine that.
 *
 * @since 1.0.7
 */
export const readClipboardText = (): Promise<string> => {
  // Firefox only
  if (env('build-target') === 'firefox') {
    return dispatchShowdexEvent<string>({ type: 'clipboardReadText' });
  }

  // Chromium-based browsers
  if (typeof navigator === 'undefined') {
    return null;
  }

  return navigator.clipboard.readText();
};
