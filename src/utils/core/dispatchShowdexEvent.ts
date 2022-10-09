import type { ShowdexEventDetail } from './createShowdexEvent';
import { createShowdexEvent, getShowdexEventName } from './createShowdexEvent';

/* eslint-disable @typescript-eslint/indent */

/**
 * Dispatches a Showdex `CustomEvent` and listens for the `'showdexresponse'`.
 *
 * * Should typically be used on Firefox only to communicate with the content script.
 *
 * @since 1.0.3
 */
export const dispatchShowdexEvent = <T = string>(
  detail: ShowdexEventDetail<T>,
): Promise<T> => new Promise((resolve, reject) => {
  if (typeof window === 'undefined') {
    reject(new Error('Global window is not available. Are you in a browser environment?'));

    return;
  }

  const showdexEventName = getShowdexEventName('response');

  const handleResponse = (e: CustomEvent<ShowdexEventDetail<T>>) => {
    window.removeEventListener(showdexEventName, handleResponse);

    if (e?.detail?.type !== 'clipboardReadText') {
      reject(new Error(`Received an unknown type ${e?.detail?.type || '(missing event.detail.type)'}`));

      return;
    }

    resolve(e.detail.payload);
  };

  window.addEventListener(showdexEventName, handleResponse);
  window.dispatchEvent(createShowdexEvent('request', detail));
});

/* eslint-enable @typescript-eslint/indent */
